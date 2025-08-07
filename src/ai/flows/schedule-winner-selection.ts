
'use server';

/**
 * @fileOverview A scheduler to automatically select and announce winners for a draw.
 * This flow should be triggered by a cron job or a manual admin action.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Draw } from '@/lib/types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SchedulerInputSchema = z.object({
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
    // Find draws that are scheduled to be announced and are not finished
    const q = query(
        drawsRef, 
        where('announcementDate', '<=', Timestamp.fromDate(new Date(currentTime))),
    );
    
    const drawsToProcessSnapshot = await getDocs(q);
    
    // Further filter out finished draws in code
    const validDraws = drawsToProcessSnapshot.docs.filter(doc => doc.data().status !== 'finished');

    if (validDraws.length === 0) {
        console.log("No draws to process at this time.");
        return { processedDraws: [] };
    }

    const processedDraws: string[] = [];

    for (const drawDoc of validDraws) {
        const drawId = drawDoc.id;
        const drawData = drawDoc.data() as Draw;
        console.log(`Processing draw: ${drawId}`);
        
        try {
            const drawRef = doc(db, 'draws', drawId);

            // If round winners haven't been selected yet, select them now.
            if (!drawData.roundWinners || Object.keys(drawData.roundWinners).length === 0) {
                const ticketsRef = collection(db, 'tickets');
                const ticketsQuery = query(ticketsRef, where('drawId', '==', drawId));
                const ticketsSnapshot = await getDocs(ticketsQuery);
                const allTicketIds = ticketsSnapshot.docs.map(doc => doc.id);

                if (allTicketIds.length < 20) {
                    console.log(`Not enough tickets for draw ${drawId} to select winners. Skipping.`);
                    continue;
                }
                
                // Fisher-Yates shuffle
                for (let i = allTicketIds.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allTicketIds[i], allTicketIds[j]] = [allTicketIds[j], allTicketIds[i]];
                }

                const round1 = allTicketIds.slice(0, 20);
                const round2 = round1.slice(0, 10).sort(() => 0.5 - Math.random());
                const round3 = round2.slice(0, 3).sort(() => 0.5 - Math.random());
                const round4 = round3.slice(0, 1).sort(() => 0.5 - Math.random());

                await updateDoc(drawRef, {
                    roundWinners: { 1: round1, 2: round2, 3: round3, 4: round4 },
                    status: 'announcing',
                    winningTicketId: round4[0] || null,
                    winnerId: ticketsSnapshot.docs.find(d => d.id === round4[0])?.data().userId || null,
                    announcedWinners: { 1: [], 2: [], 3: [], 4: [] } // Initialize announced winners
                });

                console.log(`Selected winners for draw ${drawId} and set to 'announcing'.`);
                
            } else {
                 console.log(`Draw ${drawId} is already in 'announcing' state. Resuming announcement...`);
            }

            // --- DRAMATIC ANNOUNCEMENT LOGIC ---
            const currentDrawSnap = await getDocs(query(collection(db, 'draws'), where('__name__', '==', drawId)));
            const currentDrawData = currentDrawSnap.docs[0].data() as Draw;
            
            const allRoundWinners = currentDrawData.roundWinners!;
            const announcedWinners = currentDrawData.announcedWinners || { 1: [], 2: [], 3: [], 4: [] };

            const announceRound = async (round: number, delay: number, nextRoundDelay: number) => {
                 if (announcedWinners[round] && announcedWinners[round].length >= allRoundWinners[round].length) {
                    return true; // Round already fully announced
                }
                console.log(`Announcing round ${round} for draw ${drawId}`);
                for (const winnerId of allRoundWinners[round]) {
                     if (!announcedWinners[round] || !announcedWinners[round].includes(winnerId)) {
                        await sleep(delay);
                        await updateDoc(drawRef, {
                            [`announcedWinners.${round}`]: arrayUnion(winnerId)
                        });
                        console.log(`Announced winner ${winnerId} for round ${round}`);
                    }
                }
                await sleep(nextRoundDelay);
                return true;
            };

            // This logic is now idempotent. It will pick up where it left off.
            // Announce rounds with pauses for frontend animations
            if (await announceRound(1, 5000, 10000)) { // 5s reveal delay, 10s to next round
                if (await announceRound(2, 3000, 10000)) { // 3s reveal delay, 10s to next round
                    if (await announceRound(3, 3000, 10000)) { // 3s reveal delay, 10s to finale
                        if (await announceRound(4, 3000, 10000)) { // 3s reveal delay, 10s to finish
                             await updateDoc(drawRef, { status: 'finished' });
                             console.log(`Finished announcing all winners for draw ${drawId}`);
                        }
                    }
                }
            }
            
            processedDraws.push(drawId);

        } catch (error) {
            console.error(`Failed to process draw ${drawId}:`, error);
        }
    }

    return { processedDraws };
  }
);
