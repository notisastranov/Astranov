import { Firestore } from "@google-cloud/firestore";

const db = new Firestore({
  projectId: "ais-europe-west1-d519425142f94"
});

async function test() {
  console.log("Testing Firestore connection to ais-europe-west1-d519425142f94...");
  try {
    const collections = await db.listCollections();
    console.log("Found collections:", collections.map(c => c.id));
    
    const snapshot = await db.collection("orbital_signals").limit(1).get();
    console.log("Success! Found signals:", snapshot.size);
  } catch (e: any) {
    console.error("Firestore Error:", e.message);
  }
}

test();
