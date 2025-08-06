
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Draw } from '@/lib/types';

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

    // 2. Find all draws where the user has at least one winning ticket
    const drawsRef = collection(db, 'draws');
    // Querying for all winning tickets is complex. A better approach is to query all finished draws
    // and check if the user has a winning ticket in them.
    const finishedDrawsQuery = query(drawsRef, where('status', '==', 'finished'));
    const finishedDrawsSnapshot = await getDocs(finishedDrawsQuery);

    const winningDrawsMap = new Map<string, Draw>();

    for (const drawDoc of finishedDrawsSnapshot.docs) {
        const drawData = drawDoc.data();
        
        // Check if any of the user's tickets are winners in this draw
        const allWinningTicketsInDraw = new Set(Object.values(drawData.roundWinners || {}).flat());
        const hasWinningTicket = [...userTicketIds].some(ticketId => allWinningTicketsInDraw.has(ticketId));
        
        if (hasWinningTicket) {
            // Convert Firestore timestamps to JS Dates
            const serializableDraw: Draw = {
                id: drawDoc.id,
                ...drawData,
                startDate: drawData.startDate.toDate(),
                endDate: drawData.endDate.toDate(),
                announcementDate: drawData.announcementDate.toDate(),
                createdAt: drawData.createdAt?.toDate(),
            } as Draw;
            winningDrawsMap.set(drawDoc.id, serializableDraw);
        }
    }

    const winnings = Array.from(winningDrawsMap.values());

    // Sort winnings by announcement date, most recent first
    winnings.sort((a, b) => new Date(b.announcementDate).getTime() - new Date(a.announcementDate).getTime());

    return winnings;
}
