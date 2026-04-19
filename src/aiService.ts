import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";

let chatSession = null;
let aiClient = null;

export const initGenAI = () => {
    let apiKey = "";
    try {
        apiKey = process.env.GEMINI_IN_APP_KEY || process.env.GEMINI_API_KEY;
    } catch(e) {}

    if (apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
    }
    return !!aiClient;
};

export const getClient = () => aiClient;

export const getSession = (modelName, config) => {
    if (!aiClient) return null;
    if (!chatSession || chatSession.model !== modelName) {
        chatSession = aiClient.chats.create({
            model: modelName,
            config: config
        });
        chatSession.model = modelName;
    }
    return chatSession;
};
