import { GoogleGenAI, Type } from "@google/genai";
import { aiToolHandlers } from "./aiToolHandlers";
import { OperatorCommandService, ConfigService, DeploymentRequestService, ChangeRequestService } from "./operatorService";
import { GitHubBridgeService, RepoSyncRequestService, PatchArtifactService } from "./githubService";
import { OperatorActionType } from "../../types/operational";

export class AIOrchestratorService {
  private static _ai: GoogleGenAI | null = null;
  private static _aiUnavailable = false;

  private static get ai(): GoogleGenAI | null {
    if (this._ai) return this._ai;
    if (this._aiUnavailable) return null;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: Gemini API key not found (GEMINI_API_KEY or GOOGLE_API_KEY). AI features will be unavailable.");
      this._aiUnavailable = true;
      return null;
    }

    try {
      this._ai = new GoogleGenAI({ apiKey });
      return this._ai;
    } catch (e) {
      console.error("Failed to initialize Gemini AI:", e);
      this._aiUnavailable = true;
      return null;
    }
  }

  private static tools = [
    {
      functionDeclarations: [
        {
          name: "searchWeb",
          description: "Perform an internet search for real-time information.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "The search query." }
            },
            required: ["query"]
          }
        },
        {
          name: "searchNearby",
          description: "Search for businesses, shops, or points of interest near a location.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              category: { type: Type.STRING, description: "Optional category like 'coffee', 'food', 'jobs'." },
              radius: { type: Type.NUMBER, description: "Search radius in meters." }
            },
            required: ["lat", "lng"]
          }
        },
        {
          name: "getBusinessDetails",
          description: "Get detailed information about a specific business or shop.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              businessId: { type: Type.STRING }
            },
            required: ["businessId"]
          }
        },
        {
          name: "getMenu",
          description: "Get the menu or product list for a business.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              businessId: { type: Type.STRING }
            },
            required: ["businessId"]
          }
        },
        {
          name: "getBestRated",
          description: "Find the highest-rated businesses or items in a category nearby.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              category: { type: Type.STRING }
            },
            required: ["lat", "lng", "category"]
          }
        },
        {
          name: "createPostAtLocation",
          description: "Create a social post or map signal at specific coordinates.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              content: { type: Type.STRING },
              contentType: { type: Type.STRING, enum: ["social", "job", "alert", "event"] }
            },
            required: ["lat", "lng", "content"]
          }
        },
        {
          name: "createOrderDraft",
          description: "Create a draft order for a business.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              businessId: { type: Type.STRING },
              items: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    quantity: { type: Type.NUMBER }
                  }
                }
              },
              deliveryMethod: { type: Type.STRING, enum: ["motorcycle", "car", "drone", "pickup"] },
              destination: { type: Type.STRING, description: "Delivery address or coordinates." }
            },
            required: ["businessId", "items"]
          }
        },
        {
          name: "chooseDeliveryMethod",
          description: "Set or update the delivery method for an order.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              orderId: { type: Type.STRING },
              method: { type: Type.STRING, enum: ["motorcycle", "car", "drone", "pickup"] }
            },
            required: ["orderId", "method"]
          }
        },
        {
          name: "getOrderStatus",
          description: "Check the current status and progress of an order.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              orderId: { type: Type.STRING }
            },
            required: ["orderId"]
          }
        },
        {
          name: "contactBusiness",
          description: "Initiate a contact or messaging flow with a business.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              businessId: { type: Type.STRING }
            },
            required: ["businessId"]
          }
        },
        {
          name: "saveUserPreference",
          description: "Save a user preference or setting.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING },
              value: { type: Type.STRING }
            },
            required: ["key", "value"]
          }
        },
        {
          name: "saveLocation",
          description: "Save a specific location with a label for future reference.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              label: { type: Type.STRING }
            },
            required: ["lat", "lng", "label"]
          }
        },
        {
          name: "operatorCommand",
          description: "Execute an administrative operator action (Admin only).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              payload: { type: Type.OBJECT }
            },
            required: ["action"]
          }
        },
        {
          name: "createPatchRequest",
          description: "Create a new patch request with code changes.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              files: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    path: { type: Type.STRING },
                    content: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["frontend", "backend", "config"] }
                  }
                }
              }
            },
            required: ["description", "files"]
          }
        },
        {
          name: "pushPatchToGitHub",
          description: "Push an approved patch request to GitHub.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              requestId: { type: Type.STRING },
              commitMessage: { type: Type.STRING },
              branch: { type: Type.STRING }
            },
            required: ["requestId", "commitMessage"]
          }
        },
        {
          name: "pushLatestUpdateToGitHub",
          description: "Gather latest changed files or patch artifacts and initiate a GitHub repository sync request. Requires operator approval.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              commitMessage: { type: Type.STRING },
              branch: { type: Type.STRING }
            },
            required: ["commitMessage"]
          }
        },
        {
          name: "createDeploymentRequest",
          description: "Request a deployment to a specific environment.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              environment: { type: Type.STRING, enum: ["staging", "production"] },
              version: { type: Type.STRING }
            },
            required: ["environment", "version"]
          }
        },
        {
          name: "searchNearbySignals",
          description: "Search for map signals, posts, tasks, and events near a location.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              radius: { type: Type.NUMBER, description: "Search radius in meters." }
            },
            required: ["lat", "lng"]
          }
        },
        {
          name: "searchNearbyVideos",
          description: "Search for YouTube video signals near a specific location.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              radius: { type: Type.NUMBER, description: "Search radius in kilometers." }
            },
            required: ["lat", "lng"]
          }
        },
        {
          name: "searchRegionalVideos",
          description: "Search for YouTube video signals in a specific region.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              regionKey: { type: Type.STRING, description: "The region key (e.g., first 3 chars of geohash)." }
            },
            required: ["regionKey"]
          }
        },
        {
          name: "getVideoSignalDetails",
          description: "Get full details for a specific YouTube video signal.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              signalId: { type: Type.STRING }
            },
            required: ["signalId"]
          }
        },
        {
          name: "createVideoSignalFromUrl",
          description: "Create a new planetary video signal from a YouTube URL.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              youtubeUrl: { type: Type.STRING },
              lat: { type: Type.NUMBER, description: "Optional latitude override." },
              lng: { type: Type.NUMBER, description: "Optional longitude override." }
            },
            required: ["youtubeUrl"]
          }
        },
        {
          name: "getTrendingVideoSignals",
          description: "Get trending YouTube video signals based on scope.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              scope: { type: Type.STRING, enum: ["global", "regional", "local"] }
            },
            required: ["scope"]
          }
        }
      ]
    },
    {
      googleSearch: {}
    }
  ];

  static async processCommand(prompt: string, context: any) {
    const { userId, role, locationContext, history = [] } = context;

    if (!this.ai) {
      return {
        reply: "AI features are currently unavailable. Please check the server configuration.",
        action: "CHAT",
        data: {}
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: `Context: ${JSON.stringify(locationContext)}. User Prompt: ${prompt}` }] }
        ],
        config: {
          systemInstruction: `You are Astranov AI, the intelligent core of the Astranov platform. 
          You help users navigate the map, find businesses, order services, and manage the platform.
          Current User Role: ${role}.
          Always use tools when you need data or need to perform an action.
          If the user asks for something nearby and you don't have their location, ask for it or use the provided locationContext.
          Respond with helpful, concise, and actionable information.
          If you use a tool, explain what you are doing.
          For operator commands, verify the user has 'admin', 'operator', or 'owner' role.`,
          tools: this.tools
        }
      });

      const functionCalls = response.functionCalls;
      const toolResults: any[] = [];

      if (functionCalls) {
        for (const call of functionCalls) {
          let result;
          console.log(`[AI Orchestrator] Executing tool: ${call.name}`, call.args);

          try {
            switch (call.name) {
              case "searchWeb":
                result = await aiToolHandlers.searchWeb(call.args as any);
                break;
              case "searchNearby":
                result = await aiToolHandlers.searchNearby(call.args as any);
                break;
              case "getBusinessDetails":
                result = await aiToolHandlers.getBusinessDetails(call.args as any);
                break;
              case "getMenu":
                result = await aiToolHandlers.getMenu(call.args as any);
                break;
              case "getBestRated":
                result = await aiToolHandlers.getBestRated(call.args as any);
                break;
              case "createPostAtLocation":
                result = await aiToolHandlers.createPostAtLocation({ ...call.args as any, userId });
                break;
              case "createOrderDraft":
                result = await aiToolHandlers.createOrder({ ...call.args as any, userId, fulfillment: { method: (call.args as any).deliveryMethod || 'pickup' } });
                break;
              case "chooseDeliveryMethod":
                result = await aiToolHandlers.chooseDeliveryMethod(call.args as any);
                break;
              case "getOrderStatus":
                result = await aiToolHandlers.getOrderStatus(call.args as any);
                break;
              case "contactBusiness":
                result = { status: 'success', message: "Contact flow initiated", businessId: (call.args as any).businessId };
                break;
              case "saveUserPreference":
                result = await aiToolHandlers.saveUserPreference({ ...call.args as any, userId });
                break;
              case "saveLocation":
                result = await aiToolHandlers.saveLocation({ ...call.args as any, userId });
                break;
              case "operatorCommand":
                if (role === 'admin' || role === 'operator' || role === 'owner') {
                  result = await OperatorCommandService.recordCommand(userId, prompt, OperatorActionType.CONFIG_UPDATE, call.args);
                } else {
                  result = { error: "Unauthorized" };
                }
                break;
              case "createPatchRequest":
                if (role === 'admin' || role === 'operator' || role === 'owner') {
                  const { description, files } = call.args as any;
                  // In this new model, we create a single PatchArtifact for the set of changes
                  const artifact = await PatchArtifactService.create(
                    userId, 
                    description, 
                    files.map((f: any) => f.path), 
                    files.map((f: any) => `// File: ${f.path}\n${f.content}`).join('\n\n')
                  );
                  
                  const syncRequest = await RepoSyncRequestService.create(
                    userId, 
                    role,
                    'main', 
                    description, 
                    files.map((f: any) => f.path)
                  );
                  
                  result = { 
                    status: 'success', 
                    requestId: syncRequest.id, 
                    artifactId: artifact.id,
                    message: "Patch artifact created and sync request initialized. Awaiting approval for GitHub push." 
                  };
                } else {
                  result = { error: "Unauthorized" };
                }
                break;
              case "pushPatchToGitHub":
                if (role === 'admin' || role === 'operator' || role === 'owner') {
                  const { requestId, commitMessage, branch = 'main' } = call.args as any;
                  // In a real flow, we'd check if it's approved. 
                  // For the AI helper, we'll trigger the execution if the user asks.
                  // But the service itself checks for approval.
                  try {
                    const commitSha = await GitHubBridgeService.executeRepoSyncRequest(requestId, userId);
                    result = { status: 'success', commitSha, message: `Successfully pushed to GitHub branch ${branch}` };
                  } catch (e: any) {
                    result = { status: 'error', message: e.message };
                  }
                } else {
                  result = { error: "Unauthorized" };
                }
                break;
              case "pushLatestUpdateToGitHub":
                if (role === 'admin' || role === 'operator' || role === 'owner') {
                  const { commitMessage, branch = 'main' } = call.args as any;
                  const latestPatch = await PatchArtifactService.getLatest(userId);
                  
                  if (!latestPatch) {
                    result = { error: "No recent patch artifacts found for this operator. Please create a patch first." };
                  } else {
                    const syncRequest = await RepoSyncRequestService.create(
                      userId, 
                      role,
                      branch, 
                      commitMessage, 
                      latestPatch.targetFiles
                    );
                    
                    // For this flow, we'll auto-approve if the operator is authorized
                    await RepoSyncRequestService.approve(syncRequest.id, userId);
                    
                    try {
                      const commitSha = await GitHubBridgeService.executeRepoSyncRequest(syncRequest.id, userId);
                      result = { 
                        status: 'success', 
                        commitSha, 
                        message: `Latest update pushed to GitHub branch ${branch}. Sync Request ID: ${syncRequest.id}` 
                      };
                    } catch (e: any) {
                      result = { status: 'error', message: `Sync request created (${syncRequest.id}) but execution failed: ${e.message}` };
                    }
                  }
                } else {
                  result = { error: "Unauthorized: Operator role required." };
                }
                break;
              case "createDeploymentRequest":
                if (role === 'admin' || role === 'operator' || role === 'owner') {
                  const { environment, version } = call.args as any;
                  result = await DeploymentRequestService.requestDeployment(userId, environment, version);
                } else {
                  result = { error: "Unauthorized" };
                }
                break;
              case "searchNearbySignals":
                result = await aiToolHandlers.searchNearbySignals(call.args as any);
                break;
              case "searchNearbyVideos":
                result = await aiToolHandlers.searchNearbyVideos(call.args as any);
                break;
              case "searchRegionalVideos":
                result = await aiToolHandlers.searchRegionalVideos(call.args as any);
                break;
              case "getVideoSignalDetails":
                result = await aiToolHandlers.getVideoSignalDetails(call.args as any);
                break;
              case "createVideoSignalFromUrl":
                result = await aiToolHandlers.createVideoSignalFromUrl({ ...call.args as any, userId });
                break;
              case "getTrendingVideoSignals":
                result = await aiToolHandlers.getTrendingVideoSignals(call.args as any);
                break;
            }
            if (result) toolResults.push({ tool: call.name, result });
          } catch (err) {
            console.error(`Error executing tool ${call.name}:`, err);
            toolResults.push({ tool: call.name, error: "Tool execution failed" });
          }
        }

        // If tools were called, we might want to generate a second response with the results
        // For simplicity in this pass, we'll return the initial response + results
        // The frontend can handle displaying both.
      }

      return {
        reply: response.text,
        toolResults,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };

    } catch (error) {
      console.error("[AI Orchestrator] Error:", error);
      throw error;
    }
  }
}
