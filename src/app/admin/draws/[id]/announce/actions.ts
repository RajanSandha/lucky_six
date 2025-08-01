'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Ticket, User, Draw } from '@/lib/types';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};


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
                    user = { id: userSnap.id, ...userSnap.data() } as User;
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

// This function is no longer called from the client, but is used by the scheduler flow.
export async function selectRoundWinners(drawId: string, ticketPool: {id: string}[]) {
    const shuffledPool = shuffleArray([...ticketPool]);
    
    const round1Winners = shuffledPool.slice(0, 20).map(t => t.id);
    const round2Winners = shuffleArray([...round1Winners]).slice(0, 10);
    const round3Winners = shuffleArray([...round2Winners]).slice(0, 3);
    const finalWinner = shuffleArray([...round3Winners]).slice(0, 1);

    const winningTicketId = finalWinner[0];
    const winningTicketSnap = await getDoc(doc(db, 'tickets', winningTicketId));
    const winnerId = winningTicketSnap.data()?.userId;

    const drawRef = doc(db, 'draws', drawId);
    await updateDoc(drawRef, {
        roundWinners: {
            1: round1Winners,
            2: round2Winners,
            3: round3Winners,
            4: finalWinner,
        },
        winningTicketId: winningTicketId,
        winnerId: winnerId,
        status: 'announcing',
    });
}


export async function setWinnerAsFinished(drawId: string) {
    try {
        const drawRef = doc(db, 'draws', drawId);
        await updateDoc(drawRef, {
            status: 'finished'
        });
        
        revalidatePath('/admin/draws');
        revalidatePath('/results');

        return { success: true, message: 'Draw has been marked as finished!' };
    } catch (error: any) {
        console.error("Error setting winner:", error);
        return { success: false, message: `Failed to set winner: ${error.message}` };
    }
}

export async function createMockData(drawId: string, count: number) {
    try {
        const batch = writeBatch(db);

        // Generate users
        for (let i = 0; i < count; i++) {
            const userId = `mock_user_${Date.now()}_${i}`;
            const userRef = doc(db, 'users', userId);
            const newUser: Omit<User, 'id'> = {
                name: `Mock User ${i + 1}`,
                phone: `+91999999${String(i).padStart(4, '0')}`,
                ticketIds: [] // Tickets will be added below
            };
            batch.set(userRef, newUser);

            // Generate a ticket for this user
            const ticketId = `mock_ticket_${Date.now()}_${i}`;
            const ticketRef = doc(db, 'tickets', ticketId);
            const newTicket: Omit<Ticket, 'id' | 'purchaseDate'> = {
                drawId: drawId,
                userId: userId,
                numbers: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')
            };
            batch.set(ticketRef, { ...newTicket, purchaseDate: new Date() });
        }
        
        await batch.commit();

        revalidatePath(`/admin/draws/${drawId}/announce`);
        
        return { success: true, message: `${count} mock tickets created successfully!` };
    } catch (error: any) {
        console.error("Error creating mock data:", error);
        return { success: false, message: `Failed to create mock data: ${error.message}` };
    }
}
