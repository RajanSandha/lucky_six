
'use server';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function checkUserExists(phone: string): Promise<boolean> {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking user existence:", error);
        // In case of an error, we can default to assuming user does not exist
        // to allow the registration flow to proceed, but it might fail later.
        return false;
    }
}
