
'use server';

/**
 * @fileOverview A scheduler to automatically select winners for a draw.
 * This flow should be triggered by a cron job or scheduler that runs periodically (e.g., every minute).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { selectRoundWinners } from '@/app/admin/draws/[id]/announce/actions';
import type { Draw, Ticket } from '@/lib/types';


const SchedulerInputSchema = z.object({
  // This flow doesn't require specific input, but a schema is good practice.
  currentTime: z.string().describe("The current ISO time to check against draw announcement times."),
});

const SchedulerOutputSchema = z.object({
  processedDraws: z.array(z.string()).describe("A list of Draw IDs that were processed."),
});

// This is the main function that will be called by the scheduler.
export const scheduleWinnerSelection = ai.defineFlow(
  {
    name: 'scheduleWinnerSelection',
    inputSchema: SchedulerInputSchema,
    outputSchema: SchedulerOutputSchema,
  },
  async ({ currentTime }) => {
    console.log(`Running winner selection scheduler at: ${currentTime}`);
    
    const drawsRef = collection(db, 'draws');
    // Find draws that are scheduled to be announced.
    // We will filter by status in the code to avoid a composite index.
    const q = query(
        drawsRef, 
        where('announcementDate', '<=', Timestamp.fromDate(new Date(currentTime)))
    );
    
    const drawsToProcessSnapshot = await getDocs(q);
    
    // Filter for the correct status in the code.
    const validDraws = drawsToProcessSnapshot.docs.filter(doc => {
        const status = doc.data().status;
        return status === 'upcoming' || status === 'active' || status === 'awaiting_announcement';
    });


    if (validDraws.length === 0) {
        console.log("No draws to process at this time.");
        return { processedDraws: [] };
    }

    const processedDraws: string[] = [];

    for (const drawDoc of validDraws) {
        const drawId = drawDoc.id;
        console.log(`Processing draw: ${drawId}`);
        
        try {
            // 1. Get all tickets for the draw
            const ticketsRef = collection(db, 'tickets');
            const ticketsQuery = query(ticketsRef, where('drawId', '==', drawId));
            const ticketsSnapshot = await getDocs(ticketsQuery);
            const allTickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));

            if (allTickets.length < 20) {
                 console.log(`Not enough tickets for draw ${drawId} to start announcement. Skipping.`);
                 continue;
            }

            // 2. Select winners for all rounds and update the draw document
            await selectRoundWinners(drawId, allTickets);
            
            console.log(`Successfully selected winners for draw ${drawId}`);
            processedDraws.push(drawId);

        } catch (error) {
            console.error(`Failed to process draw ${drawId}:`, error);
            // Optionally, update draw with an 'error' status
        }
    }

    return { processedDraws };
  }
);
