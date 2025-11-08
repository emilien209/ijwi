// src/firebase/firestore/use-collection.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, Query, DocumentData, CollectionReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export function useCollection<T>(path: string | null, q?: Query) {
  const db = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const pathRef = useRef(path);
  pathRef.current = path;

  useEffect(() => {
    if (!db || !pathRef.current) {
        setIsLoading(false);
        return;
    };
    
    const collectionRef = q ? q : query(collection(db, pathRef.current));

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ ...doc.data() as object, id: doc.id }) as T);
        setData(docs);
        setIsLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: (collectionRef as CollectionReference).path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, q]);

  return { data, isLoading, error };
}
