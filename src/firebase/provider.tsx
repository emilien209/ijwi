// src/firebase/provider.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, auth: null, db: null });

interface FirebaseProviderProps {
  children: ReactNode;
  value: {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
  };
}

export function FirebaseProvider({ children, value }: FirebaseProviderProps) {
  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => {
    const { app } = useFirebase();
    if (!app) throw new Error("Firebase app not available");
    return app;
}

export const useAuth = () => {
    const { auth } = useFirebase();
    if (!auth) throw new Error("Firebase Auth not available");
    return auth;
}

export const useFirestore = () => {
    const { db } = useFirebase();
    if (!db) throw new Error("Firestore not available");
    return db;
}
