
"use client";

import * as React from 'react';
import type { Draw, FullTicket, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TicketCard } from '../TicketCard';
import { RoundResultsCard } from './RoundResultsCard';
import { getTicketsByIds, STAGE_CONFIG } from './utils';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';


export function AnnouncingDisplay({
    draw,
    allTickets,
    user,
    revealingTicketId,
    onRevealComplete,
    currentStage,
    isIntermission,
    completedStage
}: {
    draw: Draw;
    allTickets: FullTicket[];
    user: User | null;
    revealingTicketId: string | null;
    onRevealComplete: (ticketId: string) => void;
    currentStage: number;
    isIntermission: boolean;
    completedStage: number | null;
}) {
    const userTickets = allTickets?.filter(t => t.userId === user?.id) || [];
    const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];
    
    if (currentStage > 4) {
        return (
             <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-8 p-4">
                 <Loader2 className="h-16 w-16 animate-spin text-primary" />
                 <h2 className="text-2xl text-center font-headline font-bold text-primary">Preparing Grand Finale...</h2>
             </div>
        )
    }

    if (!stageConfig) {
        return <div className="flex h-screen items-center justify-center"><p>Loading ceremony...</p></div>;
    }

    const announcedForThisStage = getTicketsByIds(draw.announcedWinners?.[currentStage] || [], allTickets);
    const placeholdersCount = Math.max(0, stageConfig.count - announcedForThisStage.length - (revealingTicketId ? 1 : 0));
    const revealingTicket = allTickets.find(t => t.id === revealingTicketId);

    // Special logic for when semi-final is complete
    const isAwaitingFinale = completedStage === 3 && isIntermission;


    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">
                    {isAwaitingFinale ? "Finalists Decided!" : stageConfig.title}
                </h1>
                <p className="text-muted-foreground mt-2">
                     {isAwaitingFinale ? "The grand winner will be revealed shortly!" : stageConfig.subTitle}
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Tickets ({userTickets.length})</CardTitle>
                        <CardDescription>Your tickets participating in this prize draw.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {userTickets.map(ticket => {
                            let isEliminated = false;
                            let roundReached = 0;
                            
                            if (draw.announcedWinners) {
                                for (let i = 4; i >= 1; i--) {
                                    if (draw.announcedWinners[i]?.includes(ticket.id)) {
                                        roundReached = i;
                                        break;
                                    }
                                }
                            }
                            
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
                         {userTickets.length === 0 && <p className="col-span-full text-muted-foreground">You have no tickets in this prize draw.</p>}
                    </CardContent>
                </Card>

                 {currentStage < 4 && (
                    <RoundResultsCard 
                        title="Selected This Round"
                        tickets={announcedForThisStage}
                        stage={currentStage}
                        isCurrentRound={true}
                        revealingTicket={revealingTicket}
                        onRevealComplete={onRevealComplete}
                        placeholdersCount={placeholdersCount}
                        isCelebrating={isIntermission && completedStage === currentStage}
                    />
                 )}
                
                {isIntermission && completedStage !== currentStage && !isAwaitingFinale && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Preparing Next Round...</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
                            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                            <Progress value={100} className="w-full max-w-sm transition-all duration-[9000ms] ease-linear" />
                        </CardContent>
                    </Card>
                )}
                
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
                                isCelebrating={(isIntermission && completedStage === stageNum) || (isAwaitingFinale && stageNum === 3)}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
