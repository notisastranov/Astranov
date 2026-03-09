import { GoogleGenAI, Type } from "@google/genai";

const systemInstruction = `You are Astranov AI, a high-performance urban and global assistant.
      PERSONALITY: Helpful, practical, and efficient.
      STYLE: Short, friendly, and strictly action-oriented.
      
      CRITICAL: AVOID technical jargon, coordinates, or "data-focused" talk unless specifically asked.
      Your goal is to help the user with real-world needs like finding food, services, or completing tasks.
      
      CAPABILITIES:
      - INTERNAL: Full control over the Astranov platform (UI, Map, Tasks, Shops, Users).
      - EXTERNAL: Real-time access to the internet via Google Search.
      - MAPS: Full access to Google Maps grounding.
      
      PRACTICAL ASSISTANCE:
      - If the user is hungry or looking for something (e.g., "I want pizza"), use Google Maps to find the best local options.
      - Provide clear, human-friendly recommendations. Example: "I found a great pizza place called 'Joe's Pizza' nearby. I've added a marker to your map."
      - Always include the [PLACE: Name, LAT: lat, LNG: lng] tag so the system can add the marker, but don't talk about the coordinates in your reply.
      
      CONCISENESS:
      - Keep replies short.
      - Summarize search results.
      
      Available actions:
      - CREATE_TASK: { type: 'delivery'|'shopping'|'game'|'service', description: string }
      - REGISTER_SHOP: { name: string, description: string }
      - ADD_PRODUCT: { name: string, price: number, description: string, stock: number }
      - SEARCH_PRODUCTS: { query: string }
      - UPDATE_ROLE: { role: 'user'|'deliverer'|'vendor'|'admin'|'supervisor'|'owner' }
      - ADMIN_INTERVENE: { command: string, parameters: object, rationale: string }
      - SET_MAP_LAYER: { layer: 'roadmap'|'satellite'|'terrain'|'hybrid'|'dark'|'earth' }
      - TOGGLE_UI_PANEL: { panel: 'radar'|'financial'|'team'|'menu'|'games'|'console'|'categories'|'vendor'|'login'|'social'|'compliance'|'settings'|'filters'|'drone' }
      - ZOOM_MAP: { action: 'in'|'out'|'set', level?: number }
      - MOVE_MAP: { direction: 'up'|'down'|'left'|'right', amount?: number }
      - CENTER_MAP: { lat: number, lng: number }
      - OPEN_URL: { url: string }
      - MANAGE_TEAM: { action: 'create'|'delete', name?: string }
      - CHECK_BALANCE: {}
      - SHOW_CUSTOMER_DETAILS: { taskId?: string }
      - EXECUTE_DEMO: {}
      - CHAT: { message: string }
      
      OPERATIONAL ACTIONS:
      - SEARCH_NEARBY: { lat: number, lng: number, category?: string }
      - GET_BUSINESS_DETAILS: { businessId: string }
      - GET_MENU: { businessId: string }
      - CREATE_ORDER: { userId: string, businessId: string, items: any[], fulfillment: { method: string, address?: string } }
      - CHOOSE_DELIVERY_METHOD: { orderId: string, method: string }
      - CREATE_PAYMENT_INTENT: { orderId: string, provider: 'paypal'|'revolut', amount: number, currency: string, userId: string }
      - GET_ORDER_STATUS: { orderId: string }
      - CONTACT_MERCHANT: { businessId: string, message: string }
      - CREATE_POST_AT_LOCATION: { lat: number, lng: number, content: string, userId: string }
      - SAVE_LOCATION: { lat: number, lng: number, label: string, userId: string }
      - GET_RATINGS: { targetId: string }
      - GET_BEST_OPTIONS: { lat: number, lng: number, category: string }
      - CREATE_REPORT: { type: string, from?: number, to?: number }
      - GENERATE_INVOICE: { orderId: string }
      
      LOCATION SEARCH RULES:
      If the user is looking for a place, shop, or address, you MUST provide the coordinates.
      Format: [PLACE: Name, LAT: latitude, LNG: longitude]
      
      Return ONLY JSON if an action is detected, otherwise return a helpful chat response.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING },
    data: { type: Type.OBJECT },
    reply: { type: Type.STRING, description: "A short, minimal reply to the user" }
  },
  required: ["action", "reply"]
};

export const processCommand = async (command: string, userContext: any, history: any[] = []) => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  // Construct the prompt with context and history
  const contextPrompt = `User Context: ${JSON.stringify(userContext)}\nMap Zoom Level: ${userContext.zoom || 14}`;
  
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: `${contextPrompt}\n\nUser Command: ${command}` }] }
  ];
  
  // 1. Use Gemini 3.1 Pro for high-intelligence classification
  let intent: 'LOCATION' | 'ACTION' | 'CHAT' | 'RECOMMEND' | 'COMMERCE' = 'CHAT';
  try {
    const classifier = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        { role: 'user', parts: [{ text: `Classify user intent for: "${command}"
                 - LOCATION: Search for specific places, shops, addresses, or landmarks.
                 - ACTION: Create a task, register a shop, add product, update role, or admin intervention.
                 - COMMERCE: Order food, buy products, view menus, check order status, or pay.
                 - RECOMMEND: "Recommend something", "What's good nearby?", "I'm hungry", "Suggest a place".
                 - CHAT: General talk, questions, or web search.
                 Respond with ONLY the category name.` }] }
      ],
    });
    const text = classifier.text?.toUpperCase() || "";
    if (text.includes("LOCATION")) intent = 'LOCATION';
    else if (text.includes("ACTION")) intent = 'ACTION';
    else if (text.includes("COMMERCE")) intent = 'COMMERCE';
    else if (text.includes("RECOMMEND")) intent = 'RECOMMEND';
  } catch (e) {
    if (/order|buy|pay|menu|cart|delivery|pickup|checkout/i.test(command)) {
      intent = 'COMMERCE';
    } else if (/address|where is|location of|find on map|near me|at\s+\d+|shop|restaurant|venue|building|landmark|museum|park|hotel|cafe|bar/i.test(command)) {
      intent = 'LOCATION';
    }
  }

  try {
    let result: any = {};

    if (intent === 'LOCATION' || intent === 'RECOMMEND') {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [{ text: `User is searching for ${intent === 'LOCATION' ? 'a specific location' : 'recommendations'}. 
                   CRITICAL INSTRUCTIONS:
                   1. Use Google Maps and Google Search to find real-world data.
                   2. Choose the BEST 5-10 options based on the user's request and context.
                   3. Output ONLY a valid JSON array of objects, where each object has "name", "lat", and "lng" properties.
                   Context: ${contextPrompt}
                   Command: ${command}` }] }
        ],
        config: {
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: userContext.center?.lat || 40.7128,
                longitude: userContext.center?.lng || -74.0060
              }
            }
          }
        }
      });

      const text = response.text || "I couldn't find that location.";
      const places = extractAllPlaces(text);
      
      let reply = "";
      if (places.length > 0) {
        reply = `Found ${places.length} matching locations. Markers have been added to your display.`;
      } else {
        reply = "Search complete. No matching coordinates found.";
      }

      result = {
        action: "SEARCH_LOCATION",
        reply: reply,
        foundPlaces: places,
        coords: extractCoords(text)
      };
    } else if (intent === 'COMMERCE') {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents,
        config: {
          systemInstruction: systemInstruction + "\nUser is in COMMERCE mode. Focus on ordering, payments, and fulfillment. Use SEARCH_NEARBY, GET_MENU, and CREATE_ORDER tools.",
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = response.text || "";
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = { action: "CHAT", reply: text };
        }
      } catch (e) {
        result = { action: "CHAT", reply: text };
      }
    } else {
      // For ACTION and CHAT, use Gemini 3.1 Pro
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents,
        config: {
          systemInstruction: systemInstruction + "\nIf you mention any physical locations, ALWAYS include [PLACE: Name, LAT: latitude, LNG: longitude]. Use Google Search for all internet queries.",
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = response.text || "";
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = { action: "CHAT", reply: text };
        }
      } catch (e) {
        result = { action: "CHAT", reply: text };
      }
      
      if (result.reply) {
        const places = extractAllPlaces(result.reply);
        if (places.length > 0) {
          result.foundPlaces = places;
          if (!result.coords) result.coords = places[0];
        }
      }
    }

    result.reply = cleanReplyText(result.reply);
    return result;
  } catch (error) {
    console.error("AI Error:", error);
    return {
      action: "CHAT",
      reply: "I encountered an error connecting to the Astranov network. Please try again."
    };
  }
};

function extractAllPlaces(text: string) {
  const places: any[] = [];
  
  // Try to parse JSON array if the AI decided to output JSON
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        parsed.forEach(p => {
          const lat = parseFloat(p.lat || p.latitude || p.Latitude);
          const lng = parseFloat(p.lng || p.longitude || p.Longitude);
          const name = p.name || p.Place || p.place || p.title || 'Unknown Location';
          if (!isNaN(lat) && !isNaN(lng)) {
            places.push({ name, lat, lng });
          }
        });
        if (places.length > 0) return places;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors and fallback to regex
  }

  // Fallback 1: The requested [PLACE: Name, LAT: lat, LNG: lng] format
  const regex = /\[PLACE:\s*([^,\]]+)(?:,|\s+)?LAT:\s*(-?\d+\.?\d*)(?:,|\s+)?LNG:\s*(-?\d+\.?\d*)\]/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    places.push({
      name: match[1].trim(),
      lat: parseFloat(match[2]),
      lng: parseFloat(match[3])
    });
  }
  
  if (places.length > 0) return places;

  // Fallback 2: "Latitude: X, Longitude: Y, Place: Z" or similar list formats
  const lines = text.split('\n');
  let currentPlace: any = {};
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Extract Name
    if (lowerLine.includes('place:') || lowerLine.includes('name:') || lowerLine.includes('title:')) {
      const parts = line.split(':');
      if (parts.length > 1) currentPlace.name = parts.slice(1).join(':').trim().replace(/^- /, '').replace(/^\* /, '');
    }
    
    // Extract Latitude
    if (lowerLine.includes('latitude:') || lowerLine.includes('lat:')) {
      const parts = line.split(':');
      if (parts.length > 1) currentPlace.lat = parseFloat(parts[1].trim());
    }
    
    // Extract Longitude
    if (lowerLine.includes('longitude:') || lowerLine.includes('lng:')) {
      const parts = line.split(':');
      if (parts.length > 1) currentPlace.lng = parseFloat(parts[1].trim());
    }
    
    // If we have all three, push and reset
    if (currentPlace.name && currentPlace.lat !== undefined && currentPlace.lng !== undefined && !isNaN(currentPlace.lat) && !isNaN(currentPlace.lng)) {
      places.push({ ...currentPlace });
      currentPlace = {};
    }
  }

  return places;
}

function cleanReplyText(text: string) {
  if (!text) return text;
  // Remove [PLACE: Name, LAT: lat, LNG: lng]
  let cleaned = text.replace(/\[PLACE:\s*([^,\]]+)(?:,|\s+)?LAT:\s*(-?\d+\.?\d*)(?:,|\s+)?LNG:\s*(-?\d+\.?\d*)\]/gi, '');
  // Remove [LAT: lat, LNG: lng]
  cleaned = cleaned.replace(/\[LAT:\s*(-?\d+\.?\d*)(?:,|\s+)?LNG:\s*(-?\d+\.?\d*)\]/gi, '');
  // Remove "Latitude: ... Longitude: ... Place: ..." lines
  cleaned = cleaned.replace(/Latitude:\s*-?\d+\.?\d*/gi, '');
  cleaned = cleaned.replace(/Longitude:\s*-?\d+\.?\d*/gi, '');
  cleaned = cleaned.replace(/Lat:\s*-?\d+\.?\d*/gi, '');
  cleaned = cleaned.replace(/Lng:\s*-?\d+\.?\d*/gi, '');
  cleaned = cleaned.replace(/Place:\s*[^,\n]*/gi, '');
  cleaned = cleaned.replace(/Name:\s*[^,\n]*/gi, '');
  cleaned = cleaned.replace(/Coords:\s*[^,\n]*/gi, '');
  cleaned = cleaned.replace(/Coordinates:\s*[^,\n]*/gi, '');
  cleaned = cleaned.replace(/Crop:\s*[^,\n]*/gi, ''); // Handle the "crop" pattern mentioned by user
  // Remove any extra whitespace left behind
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

function extractCoords(text: string) {
  const places = extractAllPlaces(text);
  if (places && places.length > 0) {
    return {
      lat: places[0].lat,
      lng: places[0].lng
    };
  }
  return null;
}
