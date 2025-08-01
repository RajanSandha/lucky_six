'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Ticket, User } from '@/lib/types';


export async function getTicketsForDraw(drawId: string): Promise<(Ticket & { user: User | null })[]> {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('drawId', '==', drawId));
    const ticketSnapshot = await getDocs(q);

    const ticketsWithUsers = await Promise.all(
        ticketSnapshot.docs.map(async (ticketDoc) => {
            const ticketData = ticketDoc.data() as Ticket;
            let user: User | null = null;
            if (ticketData.userId) {
                const userRef = doc(db, 'users', ticketData.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    user = userSnap.data() as User;
                }
            }
            return {
                ...ticketData,
                id: ticketDoc.id,
                purchaseDate: ticketData.purchaseDate.toDate(),
                user
            };
        })
    );

    return ticketsWithUsers;
}

export async function setWinner(drawId: string, ticketId: string, userId: string) {
    try {
        const drawRef = doc(db, 'draws', drawId);
        await updateDoc(drawRef, {
            winningTicketId: ticketId,
            winnerId: userId,
        });
        
        revalidatePath('/admin/draws');
        revalidatePath('/results');

        return { success: true, message: 'Winner has been set!' };
    } catch (error: any) {
        console.error("Error setting winner:", error);
        return { success: false, message: `Failed to set winner: ${error.message}` };
    }
}
