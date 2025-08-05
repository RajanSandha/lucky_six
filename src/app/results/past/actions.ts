
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import type { Draw, User } from '@/lib/types';
import { utcToLocalString } from '@/lib/date-utils';

async function getUserById(id: string): Promise<User | null> {
    if (!id) return null;
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
}

export type PastDrawResult = Draw & { winner?: User | null };

export async function getPastDraws(
    pageParam: Timestamp | null, 
    filters: { year: number | 'all', month: number | 'all' }
): Promise<{ draws: PastDrawResult[], nextCursor: Timestamp | null }> {
    const drawsRef = collection(db, 'draws');
    
    let q = query(
        drawsRef,
        where('status', '==', 'finished'),
        orderBy('announcementDate', 'desc'),
        limit(10)
    );

    if (pageParam) {
        q = query(q, startAfter(pageParam));
    }
    
    // NOTE: Firestore does not support inequality filters on multiple fields.
    // So, we fetch by announcementDate and then filter in code.
    // This is not ideal for performance at large scale but works for this scenario.
    // A better approach would be to store year/month on the draw document if this was a common query.

    const drawSnapshot = await getDocs(q);

    let drawList = drawSnapshot.docs
        .map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate.toDate(),
                endDate: data.endDate.toDate(),
                announcementDate: data.announcementDate.toDate(),
            } as Draw;
        });

    // Apply filters in code
    if (filters.year !== 'all' || filters.month !== 'all') {
        drawList = drawList.filter(draw => {
            const date = new Date(draw.announcementDate);
            const yearMatch = filters.year === 'all' || date.getFullYear() === filters.year;
            const monthMatch = filters.month === 'all' || date.getMonth() === filters.month;
            return yearMatch && monthMatch;
        });
    }

    const drawsWithWinnerInfo = await Promise.all(
        drawList.map(async (draw) => {
            const winner = draw.winnerId ? await getUserById(draw.winnerId) : null;
            return { ...draw, winner };
        })
    );

    const lastVisible = drawSnapshot.docs[drawSnapshot.docs.length - 1];
    const nextCursor = lastVisible ? (lastVisible.data().announcementDate as Timestamp) : null;

    return {
        draws: drawsWithWinnerInfo,
        nextCursor
    };
}