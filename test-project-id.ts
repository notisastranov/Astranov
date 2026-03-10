import admin from "firebase-admin";

admin.initializeApp({
  projectId: "gedxjzktkttqxem645qtvb"
});

const db = admin.firestore();

async function test() {
  console.log("Testing Firestore connection to gedxjzktkttqxem645qtvb...");
  try {
    const snapshot = await db.collection("orbital_signals").limit(1).get();
    console.log("Success! Found signals:", snapshot.size);
  } catch (e: any) {
    console.error("Firestore Error:", e.message);
  }
}

test();
