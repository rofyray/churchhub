'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Admin } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  adminData: Admin | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshAdminData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getFirebaseErrorMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : '';

  // Extract error code (e.g., "auth/invalid-credential")
  const codeMatch = errorMessage.match(/\(([^)]+)\)/);
  const errorCode = codeMatch ? codeMatch[1] : '';

  const errorMessages: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'Invalid email or password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/internal-error': 'Something went wrong. Please try again.',
  };

  return errorMessages[errorCode] || 'Unable to sign in. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Fetch admin data from Firestore
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminDoc.exists()) {
            setAdminData({ uid: firebaseUser.uid, ...adminDoc.data() } as Admin);
          } else {
            // User exists in Auth but not in admins collection
            setError('Access denied. You are not registered as an admin.');
            await firebaseSignOut(auth);
            setAdminData(null);
          }
        } catch (err) {
          console.error('Error fetching admin data:', err);
          setError('Failed to load user data');
        }
      } else {
        setAdminData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      setError('Firebase not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set persistence to local (survives browser restart)
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!auth) return;

    try {
      await firebaseSignOut(auth);
      setAdminData(null);
      setError(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  const clearError = () => setError(null);

  const refreshAdminData = async () => {
    if (!user) return;

    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) {
        setAdminData({ uid: user.uid, ...adminDoc.data() } as Admin);
      }
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminData,
        loading,
        error,
        signIn,
        signOut,
        clearError,
        refreshAdminData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
