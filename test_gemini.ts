
import { GoogleGenAI } from "@google/genai";

async function test() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  console.log("Using API Key:", apiKey ? "FOUND" : "MISSING");
  
  if (!apiKey) return;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello, are you there?",
    });
    console.log("Response:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
