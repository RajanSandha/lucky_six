
"use client";

import * as React from 'react';
import type { Draw, FullTicket, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TicketCard } from '../TicketCard';
import { RoundResultsCard } from './RoundResultsCard';
import { getTicketsByIds, STAGE_CONFIG } from './utils';

function getCurrentStage(draw: Draw | null): number {
    if (!draw) return 1;

    let currentStage = 1;
    if(draw.announcedWinners && draw.roundWinners) {
        const roundKeys = Object.keys(draw.roundWinners).map(Number).sort();
        for(const s of roundKeys) {
            if (s > 3) continue; // Only process up to semi-finals here
            const stageConfig = STAGE_CONFIG[s as keyof typeof STAGE_CONFIG];
            const announcedForStage = draw.announcedWinners[s] || [];
            if (announcedForStage.length < stageConfig.count) {
                currentStage = s;
                break;
            }
            if (announcedForStage.length === stageConfig.count) {
                currentStage = s + 1;
            }
        }
    }
    return currentStage;
}

export function AnnouncingDisplay({
    draw,
    allTickets,
    user,
    revealingTicketId,
    onRevealComplete
}: {
    draw: Draw;
    allTickets: FullTicket[];
    user: User | null;
    revealingTicketId: string | null;
    onRevealComplete: (ticketId: string) => void;
}) {
    const userTickets = allTickets?.filter(t => t.userId === user?.id) || [];
    const currentStage = getCurrentStage(draw);
    const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];
    
    if (!stageConfig || currentStage > 3) {
        // This can happen briefly between semi-finals ending and finale starting
        return <div className="flex h-screen items-center justify-center"><p>Preparing finale...</p></div>;
    }

    const announcedForThisStage = getTicketsByIds(draw.announcedWinners?.[currentStage] || [], allTickets);
    const placeholdersCount = Math.max(0, stageConfig.count - announcedForThisStage.length - (revealingTicketId ? 1 : 0));
    const revealingTicket = allTickets.find(t => t.id === revealingTicketId);

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">
                    {stageConfig.title}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {stageConfig.subTitle}
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Tickets ({userTickets.length})</CardTitle>
                        <CardDescription>Your tickets participating in this draw.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {userTickets.map(ticket => {
                            let isEliminated = false;
                            let roundReached = 0;
                            
                            // Determine the highest round the ticket has been announced in.
                            if (draw.announcedWinners) {
                                for (let i = 4; i >= 1; i--) {
                                    if (draw.announcedWinners[i]?.includes(ticket.id)) {
                                        roundReached = i;
                                        break;
                                    }
                                }
                            }
                            
                            // Determine if the ticket is eliminated.
                            if (roundReached === 0) {
                                let eliminated = false;
                                for (let i = 1; i < 5; i++) {
                                     const stageConf = STAGE_CONFIG[i as keyof typeof STAGE_CONFIG];
                                     const announcedInStage = draw.announcedWinners?.[i] || [];
                                     const allWinnersInStage = draw.roundWinners?.[i] || [];

                                     if (announcedInStage.length === stageConf?.count) {
                                         if (!allWinnersInStage.includes(ticket.id)) {
                                            eliminated = true;
                                            break;
                                         }
                                     } else {
                                        break;
                                     }
                                }
                                isEliminated = eliminated;
                            }


                            return (
                                <TicketCard
                                    key={`user-ticket-${ticket.id}`}
                                    ticket={ticket}
                                    isEliminated={isEliminated}
                                    isSelected={roundReached > 0}
                                    round={roundReached}
                                />
                            );
                        })}
                         {userTickets.length === 0 && <p className="col-span-full text-muted-foreground">You have no tickets in this draw.</p>}
                    </CardContent>
                </Card>

                <RoundResultsCard 
                    title="Selected This Round"
                    tickets={announcedForThisStage}
                    stage={currentStage}
                    isCurrentRound={true}
                    revealingTicket={revealingTicket}
                    onRevealComplete={onRevealComplete}
                    placeholdersCount={placeholdersCount}
                />
                
                {/* Past rounds, in descending order */}
                {Array.from({ length: currentStage - 1 }, (_, i) => currentStage - 1 - i).map(stageNum => {
                     const stageData = STAGE_CONFIG[stageNum as keyof typeof STAGE_CONFIG];
                     const announcedForStage = getTicketsByIds(draw.announcedWinners?.[stageNum] || [], allTickets)
                     const isComplete = announcedForStage.length === stageData.count;

                    if (isComplete) {
                        return (
                            <RoundResultsCard 
                                key={`past-round-${stageNum}`}
                                title={`${stageData.title} (Completed)`}
                                tickets={announcedForStage}
                                stage={stageNum}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
