
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment, limit, writeBatch } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { purchaseTicket } from '@/app/draws/[id]/actions';

// Define the shape of the context
interface AuthContextType {
  user: (User & { isAdmin: boolean }) | null;
  loading: boolean;
  login: (phone: string) => Promise<boolean>;
  register: (phone: string, name: string, referralCode?: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
}

const generate6DigitString = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

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
  const [user, setUser] = useState<(User & { isAdmin: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for a logged-in user in localStorage to persist session
    const storedUser = localStorage.getItem('lucky-six-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        isAdmin: parsedUser.role === 'admin',
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
      const fullUser = { ...userData, isAdmin: userData.role === 'admin' };

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

  const register = async (phone: string, name: string, referralCode?: string): Promise<{success: boolean, message?: string}> => {
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
            ticketIds: [],
            referralCode: newReferralCode,
            referralsMade: 0,
        };
        
        let referralMessage = '';

        // Handle referral logic
        if (referralCode) {
            const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', referralCode), limit(1));
            const referrerSnap = await getDocs(referrerQuery);

            if (referrerSnap.empty) {
                return { success: false, message: "Invalid referral code." };
            }
            
            const referrerDoc = referrerSnap.docs[0];
            const referrer = { id: referrerDoc.id, ...referrerDoc.data() } as User;

            // Find an active, referral-enabled draw
            const drawsRef = collection(db, 'draws');
            const now = new Date();
            const activeDrawQuery = query(
                drawsRef,
                where('referralAvailable', '==', true),
                where('startDate', '<=', now),
                where('endDate', '>', now),
                limit(1)
            );
            const activeDrawsSnap = await getDocs(activeDrawQuery);

            if (!activeDrawsSnap.empty) {
                const draw = { id: activeDrawsSnap.docs[0].id, ...activeDrawsSnap.docs[0].data()};
                
                const batch = writeBatch(db);

                // Issue ticket to new user
                const newUserTicketRef = doc(collection(db, 'tickets'));
                batch.set(newUserTicketRef, {
                    drawId: draw.id,
                    userId: newUser.id,
                    numbers: generate6DigitString(),
                    purchaseDate: new Date(),
                    isReferral: true,
                });
                newUser.ticketIds.push(newUserTicketRef.id);

                // Issue ticket to referrer
                const referrerTicketRef = doc(collection(db, 'tickets'));
                 batch.set(referrerTicketRef, {
                    drawId: draw.id,
                    userId: referrer.id,
                    numbers: generate6DigitString(),
                    purchaseDate: new Date(),
                    isReferral: true,
                });
                
                // Update referrer's data
                const referrerUserRef = doc(db, 'users', referrer.id);
                batch.update(referrerUserRef, { 
                    referralsMade: increment(1),
                    ticketIds: arrayUnion(referrerTicketRef.id)
                });
                
                await batch.commit();

                referralMessage = `You and your referrer both received a free ticket for the "${draw.name}" draw!`;
            }
        }

        await setDoc(doc(db, "users", userId), newUser);
        const fullUser = { ...newUser, isAdmin: newUser.role === 'admin' };
        setUser(fullUser);
        localStorage.setItem('lucky-six-user', JSON.stringify(fullUser));

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
  return context;
};
