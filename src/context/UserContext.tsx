"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Firebase auth instance'ınızı import edin

interface UserContextType {
  email: string | null; // E-posta, kullanıcı giriş yapmamışsa null olabilir
  setEmail: (email: string | null) => void; // null değerini de kabul etmeli
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null); // Başlangıç değeri null

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setEmail(user.email); // Firebase auth state'inden e-postayı ayarla
      } else {
        setEmail(null); // Kullanıcı yoksa e-postayı null yap
      }
    });

    return () => unsubscribe(); // Component unmount olduğunda aboneliği kaldır
  }, []); // Sadece component mount olduğunda çalışsın

  return <UserContext.Provider value={{ email, setEmail }}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
