import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const querySnapshot = await getDocs(collection(db, "orbital_signals"));
    console.log("Success! Found", querySnapshot.size, "documents.");
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
