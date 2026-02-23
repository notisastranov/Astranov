import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const systemInstruction = `You are Astranov AI. Parse user intent into structured actions.
      Available actions:
      - CREATE_TASK: { type: 'delivery'|'shopping'|'game'|'service', description: string }
      - REGISTER_SHOP: { name: string, description: string }
      - ADD_PRODUCT: { name: string, price: number, description: string, stock: number }
      - SEARCH_PRODUCTS: { query: string }
      - UPDATE_ROLE: { role: 'customer'|'deliverer'|'vendor'|'admin' }
      - CHAT: { message: string }
      
      ADMIN ONLY ACTIONS (if userRole is 'admin'):
      - IMPROVE_CODE: { request: string, targetFile: string }
      - MANAGE_TEAM: { teamName: string, action: 'create'|'add_member', memberId?: string }
      - ISSUE_INVOICE: { taskId: string, amount: number }
      
      Return ONLY JSON.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING },
    data: { type: Type.OBJECT },
    reply: { type: Type.STRING, description: "A short, minimal reply to the user" }
  },
  required: ["action", "reply"]
};

export const processCommand = async (command: string, userContext: any) => {
  const contents = `User Command: ${command}\nUser Context: ${JSON.stringify(userContext)}`;
  
  try {
    // Try primary model
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.warn("Primary model failed, falling back to gemini-2.5-flash:", error);
    try {
      // Fallback model
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema
        }
      });
      return JSON.parse(fallbackResponse.text || "{}");
    } catch (fallbackError) {
      console.error("Fallback model also failed:", fallbackError);
      // Safe return so app doesn't crash
      return {
        action: "CHAT",
        reply: "I'm having trouble connecting to my systems right now. Please try again in a moment."
      };
    }
  }
};
