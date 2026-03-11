import "dotenv/config";
import { Firestore } from "@google-cloud/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const firestore = new Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId
});

export let isFirestoreDisabled = false;

export const setFirestoreDisabled = (disabled: boolean) => {
  isFirestoreDisabled = disabled;
};

/**
 * Safely executes a Firestore operation and handles permission errors.
 */
export async function safeFirestore<T>(op: (db: Firestore) => Promise<T>, fallback: T): Promise<T> {
  if (isFirestoreDisabled) return fallback;
  
  try {
    return await op(firestore);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('PERMISSION_DENIED') || msg.includes('not been used in project') || msg.includes('NOT_FOUND')) {
      if (!isFirestoreDisabled) {
        console.warn("[Firestore] API not enabled, permission denied, or database not found. Switching to fallback mode.");
        isFirestoreDisabled = true;
      }
      return fallback;
    }
    console.error("[Firestore] Operation failed:", msg);
    return fallback;
  }
}

export default firestore;
