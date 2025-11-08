// src/firebase/client-provider.tsx
'use client';

import React from 'react';
import { FirebaseProvider } from './provider';
import { firebaseApp, firebaseAuth, firestoreDb } from './index';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  // Initialize Firebase on the client
  const firebaseInstances = {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firestoreDb,
  };

  return <FirebaseProvider value={firebaseInstances}>{children}</FirebaseProvider>;
}
