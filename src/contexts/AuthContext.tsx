// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, database } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';

interface User extends FirebaseUser {
  username?: string;
  role?: 'admin' | 'coder';
  assignedBatchId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user data from database
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          const userData = snapshot.val();
          
          const enhancedUser: User = Object.assign(firebaseUser, {
            username: userData?.username,
            role: userData?.role,
            assignedBatchId: userData?.assignedBatchId
          });
          
          setUser(enhancedUser);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setError(null);
      // In a real implementation, you might want to first fetch the email associated with the username
      // This is a simplified version
      const email = `${username}@your-domain.com`;
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp
      const userRef = ref(database, `users/${result.user.uid}/lastLogin`);
      await set(userRef, new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};