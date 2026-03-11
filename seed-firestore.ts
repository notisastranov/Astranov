import { Firestore } from "@google-cloud/firestore";

import firebaseConfig from "./firebase-applet-config.json";

const db = new Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId
});

async function testAndSeed() {
  console.log(`Testing Firestore connection to ${firebaseConfig.projectId} (${firebaseConfig.firestoreDatabaseId})...`);
  try {
    const collections = await db.listCollections();
    console.log("Found collections:", collections.map(c => c.id));
    
    const snapshot = await db.collection("orbital_signals").limit(1).get();
    if (snapshot.empty) {
      console.log("orbital_signals collection is empty. Seeding initial data...");
      const mockSignals = [
        { id: 'orb_1', sourceCollection: 'video_signals', sourceId: 'sig_1', type: 'video', title: 'Astranov Orbital Signal Alpha', thumbnailUrl: 'https://picsum.photos/seed/astranov1/200/200', lat: 40.7128, lng: -74.0060, geohash: 'dr5reg', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.8 },
        { id: 'orb_2', sourceCollection: 'video_signals', sourceId: 'sig_2', type: 'video', title: 'Astranov Orbital Signal Beta', thumbnailUrl: 'https://picsum.photos/seed/astranov2/200/200', lat: 34.0522, lng: -118.2437, geohash: '9q5ct', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.9 },
        { id: 'orb_3', sourceCollection: 'video_signals', sourceId: 'sig_3', type: 'video', title: 'Astranov Orbital Signal Gamma', thumbnailUrl: 'https://picsum.photos/seed/astranov3/200/200', lat: 51.5074, lng: -0.1278, geohash: 'gcpvj', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.7 },
        { id: 'orb_4', sourceCollection: 'video_signals', sourceId: 'sig_4', type: 'video', title: 'Astranov Orbital Signal Delta', thumbnailUrl: 'https://picsum.photos/seed/astranov4/200/200', lat: 35.6762, lng: 139.6503, geohash: 'xn774', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.95 },
      ];

      for (const signal of mockSignals) {
        await db.collection("orbital_signals").doc(signal.id).set(signal);
        console.log(`Seeded signal: ${signal.id}`);
      }
      console.log("Seeding completed successfully.");
    } else {
      console.log(`Found ${snapshot.size} signals in orbital_signals. No seeding needed.`);
    }
  } catch (e: any) {
    console.error("Firestore Error:", e.message);
    if (e.message.includes("PERMISSION_DENIED")) {
      console.error("Check if the Firestore API is enabled and service account has permissions.");
    }
  }
}

testAndSeed();
