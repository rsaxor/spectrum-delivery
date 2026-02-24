// src/context/auth-provider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User, getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Cookies from "js-cookie";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AUTH_TOKEN_COOKIE = "firebase-auth-token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        const token = await getIdToken(user);
        Cookies.set(AUTH_TOKEN_COOKIE, token, {
          expires: 7, 
          secure: process.env.NODE_ENV === "production", 
          sameSite: "lax", 
        });
      } else {
        Cookies.remove(AUTH_TOKEN_COOKIE);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};