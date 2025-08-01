
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { Button } from './ui/button';
import { TicketCard } from './TicketCard';
import { setWinnerAsFinished } from '@/app/admin/draws/[id]/announce/actions';
import { getDraw } from '@/app/admin/draws/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, PartyPopper, Hourglass, CheckCircle, ChevronDown, Award } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { NumberRoller } from './NumberRoller';
import withAdminAuth from './withAdminAuth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const STAGE_CONFIG = {
  1: { title: 'Qualifier Round', subTitle: 'Revealing the Top 20', count: 20 },
  2: { title: 'Quarter-Final', subTitle: 'Revealing the Top 10', count: 10 },
  3: { title: 'Semi-Final', subTitle: 'Revealing the 3 Finalists', count: 3 },
  4: { title: 'Final Round!', subTitle: 'Revealing the Grand Winner!', count: 1 },
};

type FullTicket = Ticket & { user: User | null };

const getTicketsByRound = (round: number, draw: Draw, allTickets: FullTicket[]): FullTicket[] => {
    const roundWinnerIds = draw.roundWinners?.[round] || [];
    return roundWinnerIds.map(id => allTickets.find(t => t.id === id)).filter(Boolean) as FullTicket[];
}

function FinishedDrawDisplay({ draw, allTickets }: { draw: Draw, allTickets: FullTicket[] }) {
    
    const finalWinner = getTicketsByRound(4, draw, allTickets)[0];
    const semiFinalists = getTicketsByRound(3, draw, allTickets);
    const quarterFinalists = getTicketsByRound(2, draw, allTickets);
    const qualifiers = getTicketsByRound(1, draw, allTickets);

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


function AnnounceWinnerComponent({ initialDraw, allTickets: initialAllTickets }: { initialDraw: Draw; allTickets: FullTicket[] }) {
  const [draw, setDraw] = useState(initialDraw);
  const [allTickets, setAllTickets] = useState(initialAllTickets);
  const [currentStage, setCurrentStage] = useState(1);
  const [revealedInStage, setRevealedInStage] = useState<FullTicket[]>([]);
  const [highlightedTicket, setHighlightedTicket] = useState<string | null>(null);
  const [isCeremonyFinished, setIsCeremonyFinished] = useState(draw.status === 'finished');

  const { toast } = useToast();
  const { width, height } = useWindowSize();
  
  const [rollingNumbers, setRollingNumbers] = useState<string[]>(Array(6).fill('0'));
  const [isRolling, setIsRolling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);

  const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];
  const winner = useMemo(() => isCeremonyFinished ? getTicketsByRound(4, draw, allTickets)[0] : null, [isCeremonyFinished, draw, allTickets]);


  // Real-time listener for draw updates
  useEffect(() => {
    if (!draw.id) return;
    const unsub = onSnapshot(doc(db, "draws", draw.id), (doc) => {
        if (!doc.exists()) return;
        const data = doc.data() as any;
        
        const newDrawData: Draw = {
            ...data,
            id: doc.id,
            startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
            endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
            announcementDate: data.announcementDate?.toDate ? data.announcementDate.toDate() : new Date(data.announcementDate),
        };
        setDraw(newDrawData);
        if (newDrawData.status === 'finished') {
            setIsCeremonyFinished(true);
        }
    });
    return () => unsub();
  }, [draw.id]);

  const runSlotMachine = useCallback((ticket: FullTicket) => {
    return new Promise<void>(resolve => {
        setIsRolling(true);
        setRollingNumbers(ticket.numbers.split(''));
        setRevealedIndices([]);
        
        setTimeout(() => {
             const revealNumber = (index: number) => {
                if (index >= 6) {
                    setTimeout(() => {
                        setIsRolling(false);
                        setHighlightedTicket(ticket.id);
                        setTimeout(() => {
                          setRevealedInStage(prev => {
                            if (prev.find(t => t.id === ticket.id)) return prev;
                            return [...prev, ticket];
                          });
                          setHighlightedTicket(null);
                          resolve();
                        }, 1000); 
                    }, 500);
                    return;
                }
                
                setRevealedIndices(prev => [...prev, index]);
                setTimeout(() => revealNumber(index + 1), 300);
            };
            revealNumber(0);
        }, 1000);
    });
  }, []);

  const runStageAnimation = useCallback(async (stage: number) => {
    const winnerIds = draw.roundWinners?.[stage] || [];
    if (!winnerIds.length || revealedInStage.length >= winnerIds.length) return;

    const ticketsToReveal = winnerIds.map(id => allTickets.find(t => t.id === id)).filter(Boolean) as FullTicket[];
    
    for (const ticket of ticketsToReveal) {
        if(!revealedInStage.find(t => t.id === ticket.id)) {
            await runSlotMachine(ticket);
        }
    }
    
    if (stage < 4) {
      const timeoutId = setTimeout(() => {
        setCurrentStage(prev => prev + 1);
        setRevealedInStage([]);
      }, 10000);
      return () => clearTimeout(timeoutId);
    } else {
      await setWinnerAsFinished(draw.id);
      setIsCeremonyFinished(true);
    }

  }, [draw, allTickets, runSlotMachine, revealedInStage]);


  useEffect(() => {
    if (draw.status === 'announcing' && stageConfig) {
        const cleanup = runStageAnimation(currentStage);
        return cleanup;
    }
  }, [draw.status, currentStage, runStageAnimation, stageConfig]);

  if (isCeremonyFinished) {
      if (winner) {
          return <FinishedDrawDisplay draw={draw} allTickets={allTickets} />
      }
      return (
          <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-center p-4 overflow-hidden">
            <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
            <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit mb-6">
                <Crown className="h-16 w-16 text-primary"/>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary">
              Congratulations to the Winner!
            </h1>
            <p className="text-muted-foreground mt-2 mb-6">The results for "{draw.name}" are finalized.</p>
             <p className="text-sm text-muted-foreground">The results page has been updated.</p>
          </div>
        );
  }
  
  if (draw.status !== 'announcing') {
    return (
       <div className="container mx-auto py-12 px-4 text-center">
            <Hourglass className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold font-headline">The ceremony has not yet begun.</h1>
            <p className="text-muted-foreground mt-2">Winner selection will start automatically on {new Date(draw.announcementDate).toLocaleString()}.</p>
       </div>
    )
  }
  
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
      
       {revealedInStage.length === stageConfig.count && currentStage < 4 && (
            <Card className="mb-6 bg-green-500/10 border-green-500/20">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-green-100 dark:bg-green-900/50 p-4 rounded-full w-fit">
                        <CheckCircle className="h-12 w-12 text-green-600"/>
                    </div>
                    <CardTitle className="text-green-700 font-headline mt-4">Round Complete!</CardTitle>
                    <CardDescription className="text-green-600">Starting next round shortly...</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
              <CardHeader>
                  <CardTitle className="font-headline text-primary">Slot Machine</CardTitle>
                  <CardDescription>Selecting the next ticket...</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48 bg-gray-900/80 rounded-lg p-4 border-4 border-gray-700 shadow-inner">
                 <div className="flex justify-center gap-2">
                    {rollingNumbers.map((num, index) => (
                        <NumberRoller 
                            key={index} 
                            finalNumber={num} 
                            isRolling={isRolling && !revealedIndices.includes(index)} 
                        />
                    ))}
                </div>
              </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-blue-500/5 border-blue-500/20">
              <CardHeader>
                  <CardTitle className="font-headline text-blue-600">Selected This Round ({revealedInStage.length} / {stageConfig.count || 0})</CardTitle>
                  <CardDescription>These tickets have advanced from the current stage.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 {revealedInStage.map(ticket => (
                    <TicketCard key={`revealed-${ticket.id}`} ticket={ticket} isSelected={true}/>
                 ))}
              </CardContent>
          </Card>
      </div>
       
       <Card className="mt-6">
            <CardHeader>
                <CardTitle>Ticket Pool ({allTickets.length})</CardTitle>
                <CardDescription>All tickets participating in this draw.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {allTickets.map(ticket => {
                    const isRevealed = revealedInStage.some(t => t.id === ticket.id);
                    const currentRoundWinnerIds = draw.roundWinners?.[currentStage] || [];
                    const previousRoundWinnerIds = currentStage > 1 ? (draw.roundWinners?.[currentStage - 1] || []) : allTickets.map(t => t.id);
                    
                    const isStillIn = previousRoundWinnerIds.includes(ticket.id);
                    const isEliminated = !isStillIn;

                    return (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            isEliminated={isEliminated && !isRevealed}
                            isHighlighted={highlightedTicket === ticket.id}
                            isSelected={isRevealed || currentRoundWinnerIds.includes(ticket.id)}
                        />
                    );
                })}
            </CardContent>
        </Card>
    </div>
  );
}

const AnnounceWinnerWithData = ({ params }: { params: { id: string } }) => {
    const [draw, setDraw] = useState<Draw | null>(null);
    const [tickets, setTickets] = useState<FullTicket[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const drawData = await getDraw(params.id);
                if (!drawData) {
                    setError("Draw not found.");
                    setLoading(false);
                    return;
                }
                setDraw(drawData);

                // Fetch all tickets once
                const ticketsRef = collection(db, 'tickets');
                const ticketsQuery = query(ticketsRef, where('drawId', '==', params.id));
                const ticketsSnapshot = await getDocs(ticketsQuery);
                const allTicketsData = await Promise.all(ticketsSnapshot.docs.map(async docSnapshot => {
                    const ticketData = { id: docSnapshot.id, ...docSnapshot.data() } as Ticket;
                    let user: User | null = null;
                    if (ticketData.userId) {
                        const userRef = doc(db, 'users', ticketData.userId);
                        const userSnap = await getDoc(userRef);
                        user = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as User : null;
                    }
                    return { ...ticketData, user };
                }));
                setTickets(allTicketsData);

            } catch (e: any) {
                setError(`Failed to load data: ${e.message}`);
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [params.id]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="container mx-auto py-12 px-4 text-center text-destructive">{error}</div>;
    }
    
    if (!draw || !tickets) {
        return <div className="container mx-auto py-12 px-4 text-center">Draw or ticket data is missing.</div>;
    }

    return <AnnounceWinnerComponent initialDraw={draw} allTickets={tickets} />;
};

export const AnnounceWinner = withAdminAuth(AnnounceWinnerWithData);
