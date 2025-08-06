
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Draw } from '@/lib/types';

export async function getMyWinnings(userId: string): Promise<Draw[]> {
    if (!userId) {
        return [];
    }

    // A more direct and efficient way to get winning draws for a user.
    const drawsRef = collection(db, 'draws');
    const q = query(drawsRef, where('winnerId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }

    const winnings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure all timestamp fields are converted to serializable Date objects
        return {
            id: doc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            announcementDate: data.announcementDate.toDate(),
            createdAt: data.createdAt?.toDate(),
        } as Draw;
    });

    // Sort winnings by announcement date, most recent first
    winnings.sort((a, b) => new Date(b.announcementDate).getTime() - new Date(a.announcementDate).getTime());

    return winnings;
}
