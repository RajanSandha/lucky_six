
"use client";

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
                         <Card className={cn("text-center p-6 bg-primary/10 border-primary/20 h-48 flex flex-col justify-center items-center transition-opacity duration-500", isFading ? "opacity-0" : "opacity-100")}>
                            <p className="text-xl font-semibold font-headline text-primary">
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
    const [countdown, setCountdown] = useState(50);
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

    const { width, height } = useWindowSize();
    const { user } = useAuth();
    const prevAnnouncedWinnerIds = React.useRef<Record<number, string[]>>({});


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
             if(viewState !== 'finale') {
                setViewState('finished');
             }
        } else if (draw.status === 'announcing') {
            const announcedWinnerIds = Object.values(draw.announcedWinners || {}).flat();
            const totalRoundWinnerCount = (draw.roundWinners?.[1]?.length || 0) + (draw.roundWinners?.[2]?.length || 0) + (draw.roundWinners?.[3]?.length || 0)

            if (totalRoundWinnerCount > 0 && announcedWinnerIds.length >= totalRoundWinnerCount) {
                 setViewState('finale');
            } else {
                 setViewState('announcing');
            }

            // Find the newest winner that hasn't been revealed by the UI yet
            const newWinnerId = announcedWinnerIds.find(id => !revealedWinnerIds.has(id) && id !== revealingTicketId);

            if (newWinnerId) {
                setRevealingTicketId(newWinnerId);
            }
        } else if (draw.status === 'upcoming' || draw.status === 'active' || !draw.roundWinners) {
             setViewState('awaiting');
        }

    }, [draw, allTickets, viewState, revealedWinnerIds, revealingTicketId]);


    const handleRevealComplete = (ticketId: string) => {
        setRevealedWinnerIds(prev => new Set(prev).add(ticketId));
        setRevealingTicketId(null);
    };
    
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
    
    const userTickets = allTickets?.filter(t => t.userId === user?.id) || [];
    const allAnnouncedIdsSet = new Set(Object.values(draw?.announcedWinners || {}).flat());
    
    let currentStage = 1;
    if(draw.announcedWinners) {
        for(const s of [1, 2, 3]) {
            const stageConfig = STAGE_CONFIG[s as keyof typeof STAGE_CONFIG];
            if ((draw.announcedWinners[s]?.length || 0) < stageConfig.count) {
                currentStage = s;
                break;
            }
             if ((draw.announcedWinners[s]?.length || 0) === stageConfig.count) {
                currentStage = s + 1;
            }
        }
    }
    const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];

     if (!stageConfig) {
       return <div className="flex h-screen items-center justify-center"><p>Ceremony Complete! Preparing finale...</p></div>;
    }

    const RoundResultsCard = ({ title, tickets, count, stage, description }: { title: string, tickets: FullTicket[], count: number, stage: number, description?: string }) => {
        const announcedForThisStage = getTicketsByIds(draw.announcedWinners?.[stage] || [], allTickets);
        const placeholdersCount = Math.max(0, count - announcedForThisStage.length);
        const placeholders = Array.from({ length: placeholdersCount });

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-blue-600">{title} ({announcedForThisStage.length} / {count})</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {announcedForThisStage.map(ticket => (
                        <TicketCard
                            key={`revealed-${stage}-${ticket.id}`}
                            ticket={ticket}
                            isRevealing={revealingTicketId === ticket.id}
                            onRevealComplete={() => handleRevealComplete(ticket.id)}
                            isSelected={true}
                        />
                    ))}
                    {placeholders.map((_, i) => (
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
                            // An unannounced ticket is only eliminated if a stage it could have been in is complete
                            let isEliminated = false;
                            if(!isAnnounced) {
                                for(let i=1; i < currentStage; i++) {
                                    const stageConf = STAGE_CONFIG[i as keyof typeof STAGE_CONFIG];
                                    const announcedForStage = draw.announcedWinners?.[i] || [];
                                    if(announcedForStage.length === stageConf.count) {
                                        isEliminated = true;
                                        break;
                                    }
                                }
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
                    </CardContent>
                </Card>

                {currentStage <= 3 && 
                    <RoundResultsCard 
                        title="Selected This Round"
                        tickets={[]}
                        count={stageConfig.count} 
                        stage={currentStage}
                        description="These tickets have advanced to the next stage."
                    />
                }
                
                {[2, 1].map(stageNum => {
                     const announcedForStage = draw.announcedWinners?.[stageNum] || [];
                     const stageData = STAGE_CONFIG[stageNum as keyof typeof STAGE_CONFIG];
                     const isComplete = announcedForStage.length === stageData.count;

                    if (currentStage > stageNum && isComplete) {
                        return (
                            <RoundResultsCard 
                                key={`past-round-${stageNum}`}
                                title={`${stageData.title} (Completed)`}
                                tickets={getTicketsByIds(announcedForStage, allTickets)}
                                count={stageData.count}
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
