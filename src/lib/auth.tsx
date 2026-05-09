import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  shopName: string;
  ownerName: string;
  mobile: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  premiumUntil: number;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        // Using onSnapshot to keep user doc in sync (e.g. if banned)
        const unsubDoc = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...snap.data() } as AppUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Auth snapshot error", err);
          setUser(null);
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setUser(null);
        setLoading(false);
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

export const useAuth = () => useContext(AuthContext);
