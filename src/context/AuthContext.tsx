
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment, arrayUnion, writeBatch, Timestamp } from 'firebase/firestore';
import type { User, Draw } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string) => Promise<boolean>;
  register: (phone: string, name: string, referralCode?: string, drawId?: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
}

// Helper to generate a 6-digit string
const generate6DigitString = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

// Helper to generate a unique ticket number for a specific draw
const generateUniqueTicketForDraw = async (drawId: string): Promise<string> => {
    let newTicketNumber;
    let isUnique = false;
    const ticketsRef = collection(db, 'tickets');

    while (!isUnique) {
        newTicketNumber = generate6DigitString();
        const q = query(ticketsRef, where('drawId', '==', drawId), where('numbers', '==', newTicketNumber));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            isUnique = true;
        }
    }
    return newTicketNumber!;
}


// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  register: async () => ({ success: false }),
  logout: () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for a logged-in user in localStorage to persist session
    const storedUser = localStorage.getItem('lucky-six-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
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
      
      // Force refresh the token to get custom claims
      const auth = getAuth();
      await auth.currentUser?.getIdToken(true);

      setUser(userData);
      localStorage.setItem('lucky-six-user', JSON.stringify(userData));
      return true;

    } catch (error) {
      console.error("Error logging in:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (phone: string, name: string, referralCode?: string, drawId?: string): Promise<{success: boolean, message?: string}> => {
    setLoading(true);
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: "User with this phone number already exists." };
        }

        // Generate a unique referral code for the new user
        const newReferralCode = `L6-${generate6DigitString()}`;
        const userId = doc(collection(db, 'users')).id;

        const newUser: User = {
            id: userId,
            name,
            phone,
            role: 'user', // Set default role
            ticketIds: [],
            referralCode: newReferralCode,
            referralsMade: 0,
        };
        
        let referralMessage = '';
        const batch = writeBatch(db);

        // Handle referral logic
        if (referralCode && drawId) {
            const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', referralCode));
            const referrerSnap = await getDocs(referrerQuery);
            const drawRef = doc(db, 'draws', drawId);
            const drawSnap = await getDoc(drawRef);

            if (referrerSnap.empty) {
                return { success: false, message: "Invalid referral code." };
            }
             if (!drawSnap.exists() || !drawSnap.data()?.referralAvailable) {
                return { success: false, message: "This draw is not eligible for referrals." };
            }
            
            const drawData = drawSnap.data() as Draw;
            const referrerDoc = referrerSnap.docs[0];
            const referrer = { id: referrerDoc.id, ...referrerDoc.data() } as User;

            // Issue ticket to new user
            const newUserTicketRef = doc(collection(db, 'tickets'));
            const newUserTicketNumber = await generateUniqueTicketForDraw(drawId);
            batch.set(newUserTicketRef, {
                drawId: drawId,
                userId: newUser.id,
                numbers: newUserTicketNumber,
                purchaseDate: Timestamp.now(),
                isReferral: true,
            });
            newUser.ticketIds.push(newUserTicketRef.id);

            // Issue ticket to referrer
            const referrerTicketRef = doc(collection(db, 'tickets'));
            const referrerTicketNumber = await generateUniqueTicketForDraw(drawId);
            batch.set(referrerTicketRef, {
                drawId: drawId,
                userId: referrer.id,
                numbers: referrerTicketNumber,
                purchaseDate: Timestamp.now(),
                isReferral: true,
            });
            
            // Update referrer's data
            const referrerUserRef = doc(db, 'users', referrer.id);
            batch.update(referrerUserRef, { 
                referralsMade: increment(1),
                ticketIds: arrayUnion(referrerTicketRef.id)
            });
            
            referralMessage = `You and your friend both received a free ticket for the "${drawData.name}" draw!`;
        }

        const userDocRef = doc(db, "users", userId);
        batch.set(userDocRef, newUser);
        
        await batch.commit();
        
        // Force refresh the token to get custom claims (even for new users)
        const auth = getAuth();
        await auth.currentUser?.getIdToken(true);

        setUser(newUser);
        localStorage.setItem('lucky-six-user', JSON.stringify(newUser));

        return { success: true, message: referralMessage };

    } catch (error: any) {
        console.error("Error registering user: ", error);
        return { success: false, message: error.message };
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
  // Add isAdmin helper to the hook
  const isAdmin = context.user?.role === 'admin';
  return { ...context, isAdmin };
};
