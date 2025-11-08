// src/firebase/firestore/use-doc.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T>(path: string | null) {
  const db = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const pathRef = useRef(path);
  pathRef.current = path;

  useEffect(() => {
    if (!db || !pathRef.current) {
        setIsLoading(false);
        return;
    };

    const docRef = doc(db, pathRef.current);

    const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
            if (snapshot.exists()) {
                setData({ ...snapshot.data() as object, id: snapshot.id } as T);
            } else {
                setData(null);
            }
            setIsLoading(false);
        },
        (err) => {
            const permissionError = new FirestorePermissionError({
                path: (docRef as DocumentReference).path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            setError(permissionError);
            setIsLoading(false);
        }
    );

    return () => unsubscribe();
  }, [db]);

  return { data, isLoading, error };
}
