// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { listenAuthState, getUserProfile } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // Firebase Auth user
  const [profile, setProfile] = useState(null);   // Firestore profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const displayName = profile?.name || user?.displayName || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AuthContext.Provider value={{ user, profile, loading, displayName, initials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
