"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// Define the shape of the context
interface AuthContextType {
  user: (User & { isAdmin: boolean }) | null;
  loading: boolean;
  login: (phone: string) => Promise<boolean>;
  register: (phone: string, name: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { isAdmin: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  // This would be in an environment variable in a real app
  const ADMIN_PHONE_NUMBER = "+919999999999"; 

  useEffect(() => {
    // Check for a logged-in user in localStorage to persist session
    const storedUser = localStorage.getItem('lucky-six-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        isAdmin: parsedUser.phone === ADMIN_PHONE_NUMBER,
      });
    }
    setLoading(false);
  }, []);

  const login = async (phone: string): Promise<boolean> => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", phone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No user found with this phone number.");
        return false;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      const fullUser = { ...userData, isAdmin: userData.phone === ADMIN_PHONE_NUMBER };

      setUser(fullUser);
      localStorage.setItem('lucky-six-user', JSON.stringify(fullUser));
      return true;

    } catch (error) {
      console.error("Error logging in:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (phone: string, name: string): Promise<boolean> => {
    setLoading(true);
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            console.log("User already exists");
            return false;
        }

        const userId = doc(collection(db, 'users')).id;
        const newUser: User = {
            id: userId,
            name,
            phone,
            ticketIds: []
        };
        
        await setDoc(doc(db, "users", userId), newUser);

        const fullUser = { ...newUser, isAdmin: newUser.phone === ADMIN_PHONE_NUMBER };
        setUser(fullUser);
        localStorage.setItem('lucky-six-user', JSON.stringify(fullUser));
        return true;
    } catch (error) {
        console.error("Error registering user: ", error);
        return false;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lucky-six-user');
  };

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
        );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
