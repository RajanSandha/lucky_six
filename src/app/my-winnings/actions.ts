
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { User, Ticket, Draw } from '@/lib/types';

export async function getMyWinnings(userId: string): Promise<Draw[]> {
    if (!userId) {
        return [];
    }
    
    // 1. Get all tickets for the user
    const ticketsRef = collection(db, 'tickets');
    const userTicketsQuery = query(ticketsRef, where('userId', '==', userId));
    const userTicketsSnapshot = await getDocs(userTicketsQuery);
    const userTicketIds = new Set(userTicketsSnapshot.docs.map(t => t.id));

    if (userTicketIds.size === 0) {
        return [];
    }

    // 2. Get all finished draws
    const drawsRef = collection(db, 'draws');
    const finishedDrawsQuery = query(drawsRef, where('status', '==', 'finished'));
    const finishedDrawsSnapshot = await getDocs(finishedDrawsQuery);

    const winningDraws = new Map<string, Draw>();

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
             const allWinningTicketsInDraw = new Set(Object.values(draw.roundWinners).flat());
             for (const userTicketId of userTicketIds) {
                 if(allWinningTicketsInDraw.has(userTicketId)) {
                     // User has a winning ticket in this draw. Add the draw to our map.
                     if (!winningDraws.has(draw.id)) {
                         winningDraws.set(draw.id, draw);
                     }
                     // Since we found a win, we can stop checking other tickets for this draw
                     break; 
                 }
             }
        }
    }

    const winnings = Array.from(winningDraws.values());

    // Sort winnings by announcement date, most recent first
    winnings.sort((a, b) => b.announcementDate.getTime() - a.announcementDate.getTime());

    return winnings;
}
