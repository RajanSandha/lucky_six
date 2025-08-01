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


export async function getTicketsForDraw(drawId: string, currentUserId?: string | null): Promise<(Ticket & { user: User | null })[]> {
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

    // Sort to show current user's tickets first
    if (currentUserId) {
        ticketsWithUsers.sort((a, b) => {
            if (a.userId === currentUserId && b.userId !== currentUserId) return -1;
            if (a.userId !== currentUserId && b.userId === currentUserId) return 1;
            return 0;
        });
    }

    return ticketsWithUsers;
}

export async function selectRoundWinners(drawId: string, round: number, ticketPool: {id: string}[], count: number): Promise<{id: string}[]> {
    try {
        const shuffled = shuffleArray([...ticketPool]);
        const winners = shuffled.slice(0, count);
        
        const drawRef = doc(db, 'draws', drawId);
        
        await updateDoc(drawRef, {
            [`round_${round}_winners`]: winners.map(w => w.id),
        });

        revalidatePath(`/admin/draws/${drawId}/announce`);
        
        return winners;

    } catch (error: any) {
        console.error("Error selecting round winners:", error);
        throw new Error(`Failed to select winners for round ${round}: ${error.message}`);
    }
}


export async function setWinner(drawId: string, ticketId: string, userId: string) {
    try {
        const drawRef = doc(db, 'draws', drawId);
        await updateDoc(drawRef, {
            winningTicketId: ticketId,
            winnerId: userId,
            status: 'finished'
        });
        
        revalidatePath('/admin/draws');
        revalidatePath('/results');

        return { success: true, message: 'Winner has been set!' };
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
