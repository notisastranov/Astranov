import admin from "firebase-admin";
try {
  admin.initializeApp();
  console.log("Initialized with default credentials");
  const db = admin.firestore();
  console.log("Project ID:", admin.app().options.projectId);
} catch (e: any) {
  console.error("Failed to initialize with default credentials:", e.message);
}
