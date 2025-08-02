
"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { TicketCard } from './TicketCard';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Loader2, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { NumberRoller } from './NumberRoller';


const STAGE_CONFIG = {
  1: { title: 'Qualifier Round', subTitle: 'Revealing the Top 20', count: 20 },
  2: { title: 'Quarter-Final', subTitle: 'Revealing the Top 10', count: 10 },
  3: { title: 'Semi-Final', subTitle: 'Revealing the 3 Finalists', count: 3 },
  4: { title: 'Final Round!', subTitle: 'Revealing the Grand Winner!', count: 1 },
};

type FullTicket = Ticket & { user: User | null };

const getTicketsByIds = (ids: string[], allTickets: FullTicket[]): FullTicket[] => {
    if (!ids || !allTickets) return [];
    const ticketMap = new Map(allTickets.map(t => [t.id, t]));
    return ids.map(id => ticketMap.get(id)).filter(Boolean) as FullTicket[];
}

const positiveMessages = [
    "The next winner could be you!",
    "Feeling lucky?",
    "Get ready for the big reveal!",
    "Your ticket might be the one!",
    "Anything is possible!",
    "Good luck to all participants!",
    "Stay tuned for the winning number!",
    "The excitement is building...",
];

function AwaitingCeremonyDisplay({ draw, tickets, hasMoreTickets }: { draw: Draw, tickets: FullTicket[], hasMoreTickets: boolean }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                 setMessageIndex(prevIndex => (prevIndex + 1) % positiveMessages.length);
                 setIsFading(false);
            }, 500); // fade-out duration
        }, 3000); // Change message every 3 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold font-headline text-primary">The Ceremony Is About to Begin!</h1>
                 <p className="text-muted-foreground mt-2">Winner selection starts on {new Date(draw.announcementDate).toLocaleString()}</p>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <main className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Pool ({hasMoreTickets ? '50+' : tickets.length})</CardTitle>
                            <CardDescription>A selection of tickets participating in this draw.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {tickets.map((ticket) => (
                                <TicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                />
                            ))}
                        </CardContent>
                    </Card>
                 </main>
                 <aside className="hidden lg:block">
                    <div className="sticky top-24">
                         <Card className="text-center p-6 bg-primary/10 border-primary/20 h-48 flex flex-col justify-center items-center">
                            <p className={cn("text-xl font-semibold font-headline text-primary transition-opacity duration-500", isFading ? "opacity-0" : "opacity-100")}>
                                {positiveMessages[messageIndex]}
                            </p>
                        </Card>
                    </div>
                 </aside>
             </div>
        </div>
    )
}


function FinishedDrawDisplay({ draw, allTickets }: { draw: Draw, allTickets: FullTicket[] }) {
    
    const finalWinner = getTicketsByIds(draw.announcedWinners?.[4] || [], allTickets)[0];
    const semiFinalists = getTicketsByIds(draw.announcedWinners?.[3] || [], allTickets);
    const quarterFinalists = getTicketsByIds(draw.announcedWinners?.[2] || [], allTickets);
    const qualifiers = getTicketsByIds(draw.announcedWinners?.[1] || [], allTickets);

    const renderWinnerList = (tickets: FullTicket[]) => (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 py-2">
            {tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} isSelected={true}/>)}
        </div>
    );

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold font-headline text-primary">{draw.name} - Results</h1>
                <p className="text-muted-foreground mt-2">The ceremony concluded on {new Date(draw.announcementDate).toLocaleString()}</p>
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit mb-4">
                        <Crown className="h-16 w-16 text-primary"/>
                    </div>
                    <CardTitle className="text-3xl text-accent-foreground font-headline">Grand Prize Winner</CardTitle>
                    {finalWinner && <div className="mt-4"><TicketCard ticket={finalWinner} isWinner={true} /></div>}
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="font-headline text-xl">Semi-Finalists (Top 3)</AccordionTrigger>
                            <AccordionContent>
                               {renderWinnerList(semiFinalists)}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="font-headline text-xl">Quarter-Finalists (Top 10)</AccordionTrigger>
                            <AccordionContent>
                                {renderWinnerList(quarterFinalists)}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="font-headline text-xl">Qualifiers (Top 20)</AccordionTrigger>
                            <AccordionContent>
                                {renderWinnerList(qualifiers)}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    )
}

function GrandFinale({ finalists, winner, onComplete }: { finalists: FullTicket[], winner: FullTicket | null, onComplete: () => void }) {
    const [countdown, setCountdown] = useState(10);
    const [revealed, setRevealed] = useState(false);
    const { width, height } = useWindowSize();

    useEffect(() => {
        if (!winner) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (!revealed) {
            setRevealed(true);
            const finalTimer = setTimeout(onComplete, 8000); // Wait 8s before moving to finished screen
            return () => clearTimeout(finalTimer);
        }
    }, [countdown, onComplete, revealed, winner]);
    
    if (!winner) {
        return (
            <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-8">
                <h2 className="text-4xl font-headline font-bold text-primary">And the winner is...</h2>
                <div className="flex gap-8">
                    {finalists.map(ticket => <TicketCard key={ticket.id} ticket={ticket} isFinalist={true}/>)}
                </div>
                 <p className="text-7xl font-bold font-headline text-accent animate-ping">{countdown}</p>
            </div>
        )
    }
    
    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-8">
             <Confetti width={width} height={height} recycle={false} numberOfPieces={600} tweenDuration={10000}/>
             <h2 className="text-4xl font-headline font-bold text-primary animate-pulse">CONGRATULATIONS!</h2>
             <div className="flex gap-8 items-center">
                 {finalists.map(ticket => (
                    <div key={ticket.id} className={cn(
                        "transition-all duration-1000",
                        ticket.id === winner.id ? "scale-125" : "scale-75 opacity-30"
                    )}>
                        <TicketCard ticket={ticket} isWinner={ticket.id === winner.id}/>
                    </div>
                ))}
            </div>
            <p className="text-2xl mt-4 font-semibold">
                {winner?.user?.name || 'Anonymous'} has won the Grand Prize!
            </p>
        </div>
    )
}

const AnnounceWinnerComponent = ({ params }: { params: { id: string } }) => {
    // Data states
    const [draw, setDraw] = useState<Draw | null>(null);
    const [allTickets, setAllTickets] = useState<FullTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ceremony states
    const [currentStage, setCurrentStage] = useState(1);
    const [announcedInStage, setAnnouncedInStage] = useState<FullTicket[]>([]);
    const [winnerToReveal, setWinnerToReveal] = useState<FullTicket | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [viewState, setViewState] = useState<'awaiting' | 'announcing' | 'finale' | 'finished'>('awaiting');

    const { user } = useAuth();
    const prevAnnouncedWinnerIds = React.useRef<Set<string>>(new Set());

    // Combined data fetching and real-time listener effect
    useEffect(() => {
        if (!params.id) {
            setError("No draw ID provided.");
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
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
            } catch (e: any) {
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
        if (!draw || allTickets.length === 0) return;

        // Determine current view state based on draw status
        if (draw.status === 'finished' && viewState !== 'finished') {
             // Delay this transition until the finale animation is complete
             if(viewState !== 'finale') {
                setViewState('finished');
             }
        } else if (draw.status === 'announcing') {
            const announcedWinnerIds = Object.values(draw.announcedWinners || {}).flat();
            const totalAnnouncedCount = announcedWinnerIds.length;
            const totalRoundWinnerCount = Object.values(draw.roundWinners || {}).flat().length;

            if (totalAnnouncedCount === totalRoundWinnerCount && totalAnnouncedCount > 0) {
                 setViewState('finale');
            } else {
                 setViewState('announcing');
            }
        } else if (draw.status === 'upcoming' || draw.status === 'active' || draw.status === 'awaiting_announcement') {
             setViewState('awaiting');
        }
        
        // Find the newest winner that hasn't been processed by the UI
        const allAnnouncedIds = Object.values(draw.announcedWinners || {}).flat();
        const newWinnerId = allAnnouncedIds.find(id => !prevAnnouncedWinnerIds.current.has(id));

        if (newWinnerId && !isRevealing && !winnerToReveal) {
            const newWinnerTicket = allTickets.find(t => t.id === newWinnerId);
            if (newWinnerTicket) {
                setWinnerToReveal(newWinnerTicket);
                setIsRevealing(true);
            }
        }

        // Determine current stage for display purposes
        let stage = 1;
        if (draw.announcedWinners) {
             for (const s of Object.keys(STAGE_CONFIG).map(Number)) {
                const stageConfig = STAGE_CONFIG[s as keyof typeof STAGE_CONFIG];
                if ((draw.announcedWinners[s]?.length || 0) < stageConfig.count) {
                    stage = s;
                    break;
                }
                if ((draw.announcedWinners[s]?.length || 0) === stageConfig.count) {
                    stage = s + 1;
                }
            }
        }
        setCurrentStage(stage);

        // Update the list of tickets shown in the "Selected this Round" card
        if (stage <= 4) {
             const announcedIdsForStage = draw.announcedWinners?.[stage] || [];
             setAnnouncedInStage(getTicketsByIds(announcedIdsForStage, allTickets));
        }

    }, [draw, allTickets, isRevealing, winnerToReveal, viewState]);


    const handleRevealComplete = useCallback(() => {
        if (winnerToReveal) {
            prevAnnouncedWinnerIds.current.add(winnerToReveal.id);
            // This logic is now handled by the main useEffect
        }
        setIsRevealing(false);
        setWinnerToReveal(null);
    }, [winnerToReveal]);
    
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
        const hasMoreTickets = allTickets.length >= 50;
        const displayedTickets = allTickets.slice(0, 50);
        return <AwaitingCeremonyDisplay draw={draw} tickets={displayedTickets} hasMoreTickets={hasMoreTickets}/>
    }

    if (viewState === 'finished') {
        return <FinishedDrawDisplay draw={draw} allTickets={allTickets} />
    }
    
    if (viewState === 'finale') {
        const finalists = getTicketsByIds(draw.announcedWinners?.[3] || [], allTickets);
        const winner = getTicketsByIds(draw.announcedWinners?.[4] || [], allTickets)[0] || null;
        
        return <GrandFinale finalists={finalists} winner={winner} onComplete={() => setViewState('finished')} />
    }
    
    const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];
    if (!stageConfig) {
        return <div className="flex h-screen items-center justify-center"><p>Ceremony Complete!</p></div>;
    }

    const userTickets = allTickets?.filter(t => t.userId === user?.id) || [];
    const roundIsComplete = announcedInStage.length === stageConfig.count;
    const allAnnouncedIdsSet = new Set(Object.values(draw?.announcedWinners || {}).flat());


    const SlotMachine = () => (
        <Card className="p-4 rounded-lg border-2 bg-card shadow-lg border-primary/20 flex flex-col items-center justify-center text-center">
            <h3 className="font-headline text-lg mb-2">Next Selection</h3>
            <div className="flex justify-center gap-1 p-4 bg-gray-900 rounded-lg w-full max-w-xs mx-auto">
                 {Array.from({length: 6}).map((_, index) => {
                     const finalNumber = winnerToReveal?.numbers[index] || '0';
                     return (
                         <NumberRoller
                            key={index}
                            finalNumber={finalNumber}
                            isRolling={isRevealing}
                            revealDelay={index * 500} // Staggered reveal
                            onRevealComplete={index === 5 ? handleRevealComplete : undefined}
                        />
                     )
                 })}
            </div>
            <div className="mt-2 h-5">
                { isRevealing ? (
                     <p className="text-sm text-muted-foreground animate-pulse">Revealing next winner...</p>
                ) : roundIsComplete ? (
                     <p className="text-sm font-semibold text-green-600">Round Complete! Waiting for next round...</p>
                ): (
                     <p className="text-sm text-muted-foreground">Waiting for selection...</p>
                )}
            </div>
        </Card>
      );
  
    const RoundResultsCard = ({ title, tickets, count }: { title: string, tickets: FullTicket[], count?: number }) => (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-blue-600">{title} ({tickets.length} / {count || tickets.length})</CardTitle>
                <CardDescription>These tickets have advanced.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tickets.map(ticket => (
                    <TicketCard key={`revealed-${ticket.id}`} ticket={ticket} isSelected={true}/>
                ))}
                 {count && count > tickets.length && Array.from({length: (count - tickets.length)}).map((_, i) => (
                    <div key={`placeholder-${i}`} className="p-2 md:p-4 rounded-lg border-2 bg-muted/50 shadow-sm border-dashed animate-pulse min-h-[60px]"/>
                ))}
            </CardContent>
        </Card>
    )

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <SlotMachine />
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Tickets ({userTickets.length})</CardTitle>
                            <CardDescription>Your tickets participating in this draw.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {userTickets.map(ticket => {
                                const isAnnounced = allAnnouncedIdsSet.has(ticket.id);
                                const isEliminated = draw.status === 'announcing' && !allAnnouncedIdsSet.has(ticket.id);

                                return (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        isEliminated={isEliminated}
                                        isSelected={isAnnounced}
                                    />
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>
        
            <div className="mt-8 space-y-6">
                <RoundResultsCard title="Selected This Round" tickets={announcedInStage} count={stageConfig.count} />

                {[3, 2, 1].map(stageNum => {
                    if (currentStage > stageNum) {
                        const announcedForStage = draw.announcedWinners?.[stageNum] || [];
                        if (announcedForStage.length > 0) {
                            const stageData = STAGE_CONFIG[stageNum as keyof typeof STAGE_CONFIG];
                            return (
                                <RoundResultsCard 
                                    key={`past-round-${stageNum}`}
                                    title={`${stageData.title} (${stageData.count} / ${stageData.count})`}
                                    tickets={getTicketsByIds(announcedForStage, allTickets)}
                                />
                            );
                        }
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

    