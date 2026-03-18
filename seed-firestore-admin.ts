import "dotenv/config";
import admin from "firebase-admin";

admin.initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0836698357"
});

const db = admin.firestore();

async function testAndSeed() {
  console.log("Testing Firestore connection to gen-lang-client-0836698357 using firebase-admin...");
  try {
    const collections = await db.listCollections();
    console.log("Found collections:", collections.map(c => c.id));
  } catch (e: any) {
    console.error("Firestore Error:", e.message);
  }
}

testAndSeed();
