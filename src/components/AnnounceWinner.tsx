
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { TicketCard } from './TicketCard';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Loader2, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback } from './ui/avatar';


const STAGE_CONFIG = {
  1: { title: 'Qualifier Round', subTitle: 'Revealing the Top 20', count: 20 },
  2: { title: 'Quarter-Final', subTitle: 'Revealing the Top 10', count: 10 },
  3: { title: 'Semi-Final', subTitle: 'Revealing the 3 Finalists', count: 3 },
  4: { title: 'Final Round!', subTitle: 'The Grand Winner!', count: 1 },
};

type FullTicket = Ticket & { user: User | null };

const getTicketsByIds = (ids: string[], allTickets: FullTicket[]): FullTicket[] => {
    if (!ids || !allTickets) return [];
    const ticketMap = new Map(allTickets.map(t => [t.id, t]));
    return ids.map(id => ticketMap.get(id)).filter(Boolean) as FullTicket[];
}

function AwaitingCeremonyDisplay({ draw }: { draw: Draw }) {
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold font-headline text-primary">The Ceremony Is About to Begin!</h1>
                 <p className="text-muted-foreground mt-2">Winner selection starts on {new Date(draw.announcementDate).toLocaleString()}</p>
            </div>
             <div className="flex justify-center">
                 <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Awaiting selection...</CardTitle>
                        <CardDescription>The system is preparing to select the winners. The ceremony will begin shortly.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    </CardContent>
                 </Card>
            </div>
        </div>
    )
}

function FinishedDrawDisplay({ draw, allTickets }: { draw: Draw; allTickets: FullTicket[] }) {
  const finalWinnerId = draw.winningTicketId || draw.announcedWinners?.[4]?.[0] || '';
  const finalWinnerTicket = allTickets.find(t => t.id === finalWinnerId);
  const winnerName = finalWinnerTicket?.user?.name || 'Anonymous';
  const winnerInitials = winnerName.split(' ').map(n => n[0]).join('');

  const round3Winners = getTicketsByIds(draw.roundWinners?.[3] || [], allTickets);
  const round2Winners = getTicketsByIds(draw.roundWinners?.[2] || [], allTickets);
  const round1Winners = getTicketsByIds(draw.roundWinners?.[1] || [], allTickets);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">{draw.name} - Results</h1>
        <p className="text-muted-foreground mt-2">The ceremony concluded on {new Date(draw.announcementDate).toLocaleString()}</p>
      </div>

      <Card className="max-w-4xl mx-auto shadow-2xl overflow-hidden border-accent">
        <div className="p-8 bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground">
           <CardHeader className="text-center p-0">
                <div className="mx-auto bg-background/20 p-4 rounded-full w-fit mb-4 backdrop-blur-sm">
                    <Crown className="h-12 w-12 text-white"/>
                </div>
                <CardTitle className="text-4xl font-headline tracking-tight">Grand Prize Winner</CardTitle>
            </CardHeader>
             <CardContent className="text-center p-0 mt-6">
                {finalWinnerTicket ? (
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-white/50">
                            <AvatarFallback className="bg-primary/50 text-3xl font-bold">{winnerInitials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-3xl font-bold font-headline">{winnerName}</h3>
                        <div className="bg-background/20 backdrop-blur-sm rounded-lg p-4 w-full max-w-sm">
                             <p className="text-sm opacity-80 mb-1">Winning Ticket</p>
                             <p className="text-4xl font-mono tracking-widest">{finalWinnerTicket.numbers}</p>
                        </div>
                    </div>
                ): (
                    <p>Winner details not available.</p>
                )}
            </CardContent>
        </div>
      </Card>

      <div className="max-w-4xl mx-auto mt-8">
        <h3 className="text-2xl font-bold font-headline mb-4 text-center">Round Results</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">{STAGE_CONFIG[3].title} ({round3Winners.length} Winners)</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
              {round3Winners.map(ticket => <TicketCard key={ticket.id} ticket={ticket} isSelected />)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">{STAGE_CONFIG[2].title} ({round2Winners.length} Winners)</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {round2Winners.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">{STAGE_CONFIG[1].title} ({round1Winners.length} Winners)</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {round1Winners.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </div>
  )
}


function GrandFinale({ finalists, winner, onComplete }: { finalists: FullTicket[], winner: FullTicket | null, onComplete: () => void }) {
    const [countdown, setCountdown] = useState(15);
    const [revealed, setRevealed] = useState(false);
    const { width, height } = useWindowSize();

    useEffect(() => {
        if(winner && countdown > 5) {
             setCountdown(5);
        }
    }, [winner, countdown]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (!revealed && winner) {
            setRevealed(true);
            const finalTimer = setTimeout(onComplete, 8000); // Wait 8s before moving to finished screen
            return () => clearTimeout(finalTimer);
        }
    }, [countdown, onComplete, revealed, winner]);
    
    if (!revealed) {
        return (
            <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-8 p-4">
                <h2 className="text-4xl text-center font-headline font-bold text-primary">And the winner is...</h2>
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    {finalists.map(ticket => <TicketCard key={ticket.id} ticket={ticket} isFinalist={true}/>)}
                </div>
                 <p className="text-7xl font-bold font-headline text-accent animate-pulse">{countdown}</p>
            </div>
        )
    }
    
    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-8 p-4">
             <Confetti width={width} height={height} recycle={false} numberOfPieces={600} tweenDuration={10000}/>
             <h2 className="text-4xl text-center font-headline font-bold text-primary animate-pulse">CONGRATULATIONS!</h2>
             <div className="flex flex-col md:flex-row gap-8 items-center">
                 {finalists.map(ticket => (
                    <div key={ticket.id} className={cn(
                        "transition-all duration-1000",
                        winner && ticket.id === winner.id ? "scale-125" : "scale-75 opacity-30"
                    )}>
                        <TicketCard ticket={ticket} isWinner={winner ? ticket.id === winner.id : false}/>
                    </div>
                ))}
            </div>
            {winner && (
                 <p className="text-2xl mt-4 font-semibold text-center">
                    {winner.user?.name || 'Anonymous'} has won the Grand Prize!
                </p>
            )}
        </div>
    )
}

function AnnounceWinnerComponent({ params }: { params: { id: string } }) {
    // Data states
    const [draw, setDraw] = useState<Draw | null>(null);
    const [allTickets, setAllTickets] = useState<FullTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ceremony states
    const [viewState, setViewState] = useState<'awaiting' | 'announcing' | 'finale' | 'finished'>('awaiting');
    const [revealingTicketId, setRevealingTicketId] = useState<string | null>(null);
    const [revealedWinnerIds, setRevealedWinnerIds] = useState<Set<string>>(new Set());
    
    const { user } = useAuth();
    const prevAnnouncedWinnersRef = React.useRef<Record<number, string[]>>({});


    useEffect(() => {
        if (!params.id) {
            setError("No draw ID provided.");
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch all tickets for the draw once
                const ticketsQuery = query(collection(db, 'tickets'), where('drawId', '==', params.id));
                const ticketsSnapshot = await getDocs(ticketsQuery);
                const allTicketsData = await Promise.all(ticketsSnapshot.docs.map(async (docSnapshot) => {
                    const ticketData = { id: docSnapshot.id, ...docSnapshot.data() } as Ticket;
                    let userData: User | null = null;
                    if (ticketData.userId) {
                        const userRef = doc(db, 'users', ticketData.userId);
                        const userSnap = await getDoc(userRef);
                        userData = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as User : null;
                    }
                    return { ...ticketData, user: userData, purchaseDate: ticketData.purchaseDate };
                }));
                setAllTickets(allTicketsData);
            } catch (e: any) => {
                setError(`Failed to load ticket data: ${e.message}`);
            } finally {
                 setLoading(false);
            }
        };

        fetchInitialData();

        const unsub = onSnapshot(doc(db, "draws", params.id), (doc) => {
            if (doc.exists()) {
                const data = doc.data() as any;
                const newDrawData: Draw = {
                    ...data,
                    id: doc.id,
                    startDate: data.startDate?.toDate(),
                    endDate: data.endDate?.toDate(),
                    announcementDate: data.announcementDate?.toDate(),
                };
                setDraw(newDrawData);
            } else {
                setError("Draw not found.");
            }
            if(loading) setLoading(false);
        });

        return () => unsub();
    }, [params.id]);


    // Effect to process draw updates and manage ceremony flow
    useEffect(() => {
        if (!draw) return;

        // Determine current view state based on draw status
        if (draw.status === 'finished') {
            if (viewState !== 'finale' && viewState !== 'finished') {
                setViewState('finished');
            }
        } else if (draw.status === 'announcing' || (draw.announcedWinners && Object.keys(draw.announcedWinners).length > 0)) {
            const announcedRounds = Object.keys(draw.announcedWinners || {}).map(Number);
            const semiFinalAnnounced = announcedRounds.includes(3) && draw.announcedWinners![3].length === STAGE_CONFIG[3].count;
            
            if (semiFinalAnnounced) {
                if (viewState !== 'finale') {
                    setViewState('finale');
                }
                return;
            }
            if (viewState !== 'announcing') {
                setViewState('announcing');
            }


            const allAnnouncedWinners = Object.values(draw.announcedWinners || {}).flat();
            const previouslyRevealedIds = new Set([...revealedWinnerIds, ...allAnnouncedWinners.filter(id => id !== revealingTicketId)]);
            const newWinner = allAnnouncedWinners.find(id => !previouslyRevealedIds.has(id));


            if (newWinner && !revealingTicketId) {
                setRevealingTicketId(newWinner);
            }

        } else if (viewState !== 'awaiting') {
            setViewState('awaiting');
        }

    }, [draw, revealedWinnerIds, revealingTicketId]);


    const handleRevealComplete = useCallback((ticketId: string) => {
        setRevealedWinnerIds(prev => new Set(prev).add(ticketId));
        setRevealingTicketId(null);
    }, []);
    
    
    // RENDER LOGIC
    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }
    if (error) {
        return <div className="container mx-auto py-12 px-4 text-center text-destructive">{error}</div>;
    }
    if (!draw) {
        return <div className="container mx-auto py-12 px-4 text-center">Draw data is not available.</div>;
    }

    if (viewState === 'awaiting') {
        return <AwaitingCeremonyDisplay draw={draw} />
    }

    if (viewState === 'finished') {
        return <FinishedDrawDisplay draw={draw} allTickets={allTickets} />
    }
    
    if (viewState === 'finale') {
        const finalists = getTicketsByIds(draw.announcedWinners?.[3] || [], allTickets);
        const winner = getTicketsByIds(draw.announcedWinners?.[4] || [], allTickets)[0] || null;
        
        return <GrandFinale finalists={finalists} winner={winner} onComplete={() => setViewState('finished')} />
    }

    const userTickets = allTickets?.filter(t => t.userId === user?.id) || [];
    const allAnnouncedIdsSet = new Set(Object.values(draw?.announcedWinners || {}).flat());
    
    let currentStage = 1;
    if(draw.announcedWinners) {
        const roundKeys = Object.keys(draw.roundWinners || {}).map(Number).sort();
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
    const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];

    if (!stageConfig || currentStage > 3) {
        // This can happen briefly between semi-finals ending and finale starting
        return <div className="flex h-screen items-center justify-center"><p>Preparing finale...</p></div>;
    }

    const announcedForThisStage = getTicketsByIds(draw.announcedWinners?.[currentStage] || [], allTickets);
    const placeholdersCount = Math.max(0, stageConfig.count - announcedForThisStage.length - (revealingTicketId ? 1 : 0));
    
    const revealingTicket = allTickets.find(t => t.id === revealingTicketId);


    const RoundResultsCard = ({ title, tickets, stage, isCurrentRound }: { title: string, tickets: FullTicket[], stage: number, isCurrentRound?: boolean }) => {
        const stageData = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
        const count = stageData.count;

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-blue-600">{title} ({tickets.length} / {count})</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tickets.map(ticket => (
                        <TicketCard
                            key={`revealed-${stage}-${ticket.id}`}
                            ticket={ticket}
                            isSelected={true}
                        />
                    ))}
                    {isCurrentRound && revealingTicket && (
                         <TicketCard
                            key={`revealing-${stage}-${revealingTicket.id}`}
                            ticket={revealingTicket}
                            isRevealing={true}
                            onRevealComplete={() => handleRevealComplete(revealingTicket.id)}
                            isSelected={true}
                        />
                    )}
                    {isCurrentRound && Array.from({ length: placeholdersCount }).map((_, i) => (
                        <div key={`placeholder-${stage}-${i}`} className="p-2 md:p-4 rounded-lg border-2 bg-muted/50 shadow-sm border-dashed animate-pulse min-h-[76px]"/>
                    ))}
                </CardContent>
            </Card>
        )
    };

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
                            const isAnnounced = allAnnouncedIdsSet.has(ticket.id);
                            let isEliminated = false;
                            
                            // Determine if the round the ticket *could have* won in is already complete.
                            if (!isAnnounced) {
                                let eliminated = false;
                                for(let i=1; i < 5; i++) { // Check all rounds
                                    const allWinnersForStage = draw.roundWinners?.[i] || [];
                                    const announcedInStage = draw.announcedWinners?.[i] || [];
                                    const stageConf = STAGE_CONFIG[i as keyof typeof STAGE_CONFIG];
                                    
                                    // If a round is fully announced and the user's ticket wasn't in the winners list for that round, it's out.
                                    if (announcedInStage.length === stageConf?.count && !allWinnersForStage.includes(ticket.id)) {
                                         eliminated = true;
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
                                    isSelected={isAnnounced}
                                />
                            );
                        })}
                         {userTickets.length === 0 && <p className="col-span-full text-muted-foreground">You have no tickets in this draw.</p>}
                    </CardContent>
                </Card>

                {currentStage <= 3 && 
                    <RoundResultsCard 
                        title="Selected This Round"
                        tickets={getTicketsByIds(draw.announcedWinners?.[currentStage] || [], allTickets)}
                        stage={currentStage}
                        isCurrentRound={true}
                    />
                }
                
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
};


export const AnnounceWinner = ({ params }: { params: { id: string } }) => {
    return <AnnounceWinnerComponent params={params} />;
};

    