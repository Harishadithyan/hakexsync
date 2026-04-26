// src/services/authService.js
// All Firebase Authentication operations

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Sign Up ────────────────────────────────────────────────────────
export async function signUp(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Attach display name to Firebase Auth profile
  await updateProfile(cred.user, { displayName: name });

  // Create user document in Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    uid:       cred.user.uid,
    name,
    email,
    plan:      "pro",
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

// ── Sign In ────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Sign Out ───────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}

// ── Get Firestore user profile ─────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ── Auth state listener (returns unsubscribe fn) ───────────────────
export function listenAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Password Reset ─────────────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Friendly error messages ────────────────────────────────────────
export function parseAuthError(code) {
  const map = {
    "auth/email-already-in-use":    "This email is already registered.",
    "auth/invalid-email":           "Invalid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/too-many-requests":       "Too many attempts. Please wait and try again.",
    "auth/network-request-failed":  "Network error. Check your connection.",
    "auth/invalid-credential":      "Invalid email or password.",
  };
  return map[code] || "An unexpected error occurred. Please try again.";
}
