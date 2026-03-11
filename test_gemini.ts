import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function test() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  console.log("Using API Key starting with:", apiKey ? apiKey.substring(0, 4) : "NONE");
  
  if (!apiKey) {
    console.error("No API key found.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: 'user', parts: [{ text: "Hello, are you there?" }] }]
    });
    console.log("Response:", response.text);
    console.log("SUCCESS");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    process.exit(1);
  }
}

test();
