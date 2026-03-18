import { Firestore } from "@google-cloud/firestore";

const db = new Firestore({
  projectId: "ais-europe-west1-d519425142f94"
});

async function test() {
  try {
    const collections = await db.listCollections();
    console.log("Success! Found collections:", collections.map(c => c.id));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
