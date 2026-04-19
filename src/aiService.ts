import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export const initGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
    }
    return !!aiClient;
};

export const sendMessage = async (message: string, history: { role: string, parts: { text: string }[] }[] = []) => {
    if (!aiClient) {
        initGenAI();
        if (!aiClient) throw new Error("AI Client not initialized. GEMINI_API_KEY missing.");
    }

    try {
        const result = await aiClient.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [...history, { role: "user", parts: [{ text: message }] }],
            config: {
                systemInstruction: "You are Astranov OS, an advanced orbital logistics and distribution neural link. Your tone is technical, cold, yet efficient. Use terms like 'Neural Link Established', 'Vector Confirmed', 'Orbital GPS Lock'. Avoid standard assistant pleasantries. Be concise.",
                temperature: 0.7,
                topP: 0.95
            }
        });
        
        return result.text;
    } catch (error) {
        console.error("Gemini Error:", error);
        return "ERROR: Neural Link Interrupted. Vector data corrupted.";
    }
};
