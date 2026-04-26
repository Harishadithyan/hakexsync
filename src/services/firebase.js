// ─────────────────────────────────────────────────────────────────
//  src/services/firebase.js
//  Replace ALL values below with your own Firebase project config.
//  Get them from: Firebase Console → Project Settings → General → SDK setup
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// ⚠️  PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyBOWuJY1Bn75b4mKIO2y4mKpN4w7V8P_PU",
  authDomain: "hakexsync.firebaseapp.com",
  projectId: "hakexsync",
  storageBucket: "hakexsync.firebasestorage.app",
  messagingSenderId: "191159691560",
  appId: "1:191159691560:web:19cdfd7b27d95e42c2881d",
  measurementId: "G-J8DN03T97K"
};


const app      = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);       // Firestore – device docs
export const rtdb    = getDatabase(app);         // Realtime DB – live telemetry
export const storage = getStorage(app);

export default app;
