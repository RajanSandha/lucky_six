
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { User, Ticket, Draw } from '@/lib/types';

// This is not a performant way to get winnings for a user at scale.
// For a production app, a better approach would be to have a 'winnings' subcollection on the user,
// or a top-level 'winnings' collection that is written to when a draw is finished.
// However, for the current schema, this is the way to derive the winnings.

export type WinningEntry = {
    draw: Draw;
    winningTicket: Ticket;
    round: number;
    prize: number; // Placeholder for prize, real logic would be more complex
}

export async function getMyWinnings(userId: string): Promise<WinningEntry[]> {
    if (!userId) {
        return [];
    }
    
    // 1. Get all tickets for the user
    const ticketsRef = collection(db, 'tickets');
    const userTicketsQuery = query(ticketsRef, where('userId', '==', userId));
    const userTicketsSnapshot = await getDocs(userTicketsQuery);
    const userTickets = userTicketsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ticket));
    const userTicketIds = new Set(userTickets.map(t => t.id));

    if (userTickets.length === 0) {
        return [];
    }

    // 2. Get all finished draws
    const drawsRef = collection(db, 'draws');
    const finishedDrawsQuery = query(drawsRef, where('status', '==', 'finished'));
    const finishedDrawsSnapshot = await getDocs(finishedDrawsQuery);

    const winnings: WinningEntry[] = [];

    // 3. For each finished draw, check if any of the user's tickets are winners
    for (const drawDoc of finishedDrawsSnapshot.docs) {
        const draw = {
            id: drawDoc.id,
            ...drawDoc.data(),
            startDate: drawDoc.data().startDate.toDate(),
            endDate: drawDoc.data().endDate.toDate(),
            announcementDate: drawDoc.data().announcementDate.toDate(),
        } as Draw;
        
        if (draw.roundWinners) {
            for (const round of Object.keys(draw.roundWinners)) {
                const roundNumber = parseInt(round, 10);
                const winningTicketIdsInRound = draw.roundWinners[roundNumber];

                for (const ticketId of winningTicketIdsInRound) {
                    if (userTicketIds.has(ticketId)) {
                        const winningTicket = userTickets.find(t => t.id === ticketId);
                        if (winningTicket) {
                            // Simplified prize calculation. A real app would have specific prizes per round.
                            // For now, let's assume the main prize for the final winner, and a smaller fixed amount for others.
                            const prize = roundNumber === 4 ? draw.prize : 0; 
                            
                             winnings.push({
                                draw,
                                winningTicket: {
                                    ...winningTicket,
                                    purchaseDate: (winningTicket.purchaseDate as any).toDate()
                                },
                                round: roundNumber,
                                prize,
                            });
                        }
                    }
                }
            }
        }
    }

    // Sort winnings by announcement date, most recent first
    winnings.sort((a, b) => b.draw.announcementDate.getTime() - a.draw.announcementDate.getTime());

    return winnings;
}
