
"use client";

import { useState, useEffect } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { TicketCard } from './TicketCard';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Loader2, Crown, CheckCircle, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, limit } from 'firebase/firestore';
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
    return ids.map(id => allTickets.find(t => t.id === id)).filter(Boolean) as FullTicket[];
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
                        <Card className="text-center p-6 bg-primary/10 border-primary/20 flex flex-col justify-center items-center h-48">
                            <Star className="h-16 w-16 text-primary animate-pulse mb-4"/>
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

function GrandFinale({ finalists, onComplete }: { finalists: FullTicket[], onComplete: () => void }) {
    const [countdown, setCountdown] = useState(10);
    const [revealed, setRevealed] = useState(false);
    const { width, height } = useWindowSize();

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setRevealed(true);
            const finalTimer = setTimeout(onComplete, 5000); // Wait 5s before moving to finished screen
            return () => clearTimeout(finalTimer);
        }
    }, [countdown, onComplete]);
    
    if (!revealed) {
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

    const winner = finalists[0]; // Assuming the first finalist is the winner based on announcement order
    
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
                {winner.user?.name || 'Anonymous'} has won the Grand Prize!
            </p>
        </div>
    )
}

export const AnnounceWinner = ({ params }: { params: { id: string } }) => {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [allTickets, setAllTickets] = useState<FullTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedDigits, setRevealedDigits] = useState<number>(0);
  const [currentAnnouncedWinner, setCurrentAnnouncedWinner] = useState<FullTicket | null>(null);
  const [showFinale, setShowFinale] = useState(false);
  const [ceremonyComplete, setCeremonyComplete] = useState(false);

  const { width, height } = useWindowSize();
  const { user } = useAuth();
  const prevAnnouncedWinnersRef = React.useRef<Record<number, string[]>>({});


  useEffect(() => {
    if (!params.id) {
        setError("No draw ID provided.");
        setLoading(false);
        return;
    }

    const unsub = onSnapshot(doc(db, "draws", params.id), (doc) => {
        if (!doc.exists()) {
            setError("Draw not found.");
            setDraw(null);
            return;
        };
        const data = doc.data() as any;
        const newDrawData: Draw = {
            ...data,
            id: doc.id,
            startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
            endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
            announcementDate: data.announcementDate?.toDate ? data.announcementDate.toDate() : new Date(data.announcementDate),
        };
        setDraw(newDrawData);
    });

    const fetchTickets = async () => {
        try {
            const drawDataSnap = await getDoc(doc(db, 'draws', params.id));
            if (!drawDataSnap.exists()) {
              setLoading(false);
              return;
            }
             const drawStatus = drawDataSnap.data().status;
             const isUpcoming = drawStatus !== 'announcing' && drawStatus !== 'finished';
             
             const ticketsQuery = isUpcoming 
                    ? query(collection(db, 'tickets'), where('drawId', '==', params.id), limit(50))
                    : query(collection(db, 'tickets'), where('drawId', '==', params.id));

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
        } catch(e: any) {
            setError(`Failed to load tickets: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    fetchTickets();
    
    return () => unsub();
  }, [params.id]);


  // Determine the current stage
  const currentStage = !draw ? 0 : (() => {
    if (!draw.announcedWinners) return 1;
    if (draw.announcedWinners[1]?.length < STAGE_CONFIG[1].count) return 1;
    if (draw.announcedWinners[2]?.length < STAGE_CONFIG[2].count) return 2;
    if (draw.announcedWinners[3]?.length < STAGE_CONFIG[3].count) return 3;
    if (draw.announcedWinners[4]?.length < STAGE_CONFIG[4].count) return 4;
    return 5; // Ceremony finished
  })();
  
  const stageConfig = (currentStage > 0 && currentStage < 5) ? STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG] : null;

  // Find the winner that was just announced
  useEffect(() => {
    if (!draw || !draw.announcedWinners || !allTickets) return;

    const prevAnnounced = prevAnnouncedWinnersRef.current;
    let newWinnerId: string | null = null;

    // Find which round has a new winner
    for (const round in draw.announcedWinners) {
        const currentRoundWinners = draw.announcedWinners[round];
        const prevRoundWinners = prevAnnounced[round] || [];
        if (currentRoundWinners.length > prevRoundWinners.length) {
            newWinnerId = currentRoundWinners[currentRoundWinners.length - 1];
            break;
        }
    }

    if (newWinnerId) {
        const newWinnerTicket = allTickets.find(t => t.id === newWinnerId);
        if (newWinnerTicket) {
             setCurrentAnnouncedWinner(newWinnerTicket);
        }
    }
    
    // Update the ref for the next render
    prevAnnouncedWinnersRef.current = draw.announcedWinners;
  }, [draw?.announcedWinners, allTickets]);


  // Left-to-right reveal animation effect
  useEffect(() => {
    setRevealedDigits(0); // Reset on new winner
    if (currentAnnouncedWinner) {
      const timers = Array.from({ length: 6 }).map((_, i) =>
        setTimeout(() => {
          setRevealedDigits(prev => prev + 1);
        }, (i + 1) * 800) // Reveal one digit every 800ms
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [currentAnnouncedWinner]);

  useEffect(() => {
    // Trigger finale when moving to stage 5 (finished)
    if (currentStage === 5 && !ceremonyComplete) {
      setShowFinale(true);
    }
  }, [currentStage, ceremonyComplete]);


  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="container mx-auto py-12 px-4 text-center text-destructive">{error}</div>;
  }
  if (!draw || !allTickets) {
      return <div className="container mx-auto py-12 px-4 text-center">Draw data is not available.</div>;
  }

  const isFinished = draw.status === 'finished' && ceremonyComplete;
  
  if (isFinished) {
      return <FinishedDrawDisplay draw={draw} allTickets={allTickets} />
  }

  if (draw.status !== 'announcing' || !draw.roundWinners) {
     const hasMoreTickets = allTickets.length >= 50;
     const displayedTickets = allTickets.slice(0, 50);
    return <AwaitingCeremonyDisplay draw={draw} tickets={displayedTickets} hasMoreTickets={hasMoreTickets}/>
  }

  if (showFinale && currentStage === 5) {
      const finalists = getTicketsByIds(draw.announcedWinners?.[4] || [], allTickets);
      return <GrandFinale finalists={finalists} onComplete={() => setCeremonyComplete(true)} />
  }
    
  if (!stageConfig) {
      return <div className="container mx-auto py-12 px-4 text-center">Invalid ceremony stage.</div>;
  }
  
  const announcedInStage = getTicketsByIds(draw.announcedWinners?.[currentStage] || [], allTickets);
  const roundIsComplete = announcedInStage.length === stageConfig.count;
  const userTickets = allTickets?.filter(t => t.userId === user?.id) || [];
  
  const SlotMachine = () => (
    <Card className="p-4 rounded-lg border-2 bg-card shadow-lg border-primary/20 flex flex-col items-center justify-center text-center">
        <h3 className="font-headline text-lg mb-2">Next Selection</h3>
        <div className="flex justify-center gap-1 p-4 bg-gray-900 rounded-lg w-full max-w-xs mx-auto">
             {Array.from({length: 6}).map((_, index) => {
                 const isRevealed = index < revealedDigits;
                 const finalNumber = currentAnnouncedWinner?.numbers[index] || '0';
                 return (
                     <NumberRoller
                        key={index}
                        finalNumber={finalNumber}
                        isRolling={!isRevealed && !roundIsComplete}
                    />
                 )
             })}
        </div>
        <div className="mt-2 h-5">
            { roundIsComplete ? (
                 <p className="text-sm font-semibold text-green-600">Round Complete! Waiting for next round...</p>
            ) : currentAnnouncedWinner && revealedDigits < 6 ? (
                 <p className="text-sm text-muted-foreground animate-pulse">Revealing next winner...</p>
            ) : (
                 <p className="text-sm text-muted-foreground">Waiting for selection...</p>
            )}
        </div>
    </Card>
  );
  
  const RoundResultsCard = ({ title, tickets, count }: { title: string, tickets: FullTicket[], count?: number}) => (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
              <div className="sticky top-24 space-y-6">
                   <SlotMachine />
              </div>
          </div>

          <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Your Tickets ({userTickets.length})</CardTitle>
                    <CardDescription>Your tickets participating in this draw.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {userTickets.map(ticket => {
                        const isAnnounced = Object.values(draw.announcedWinners || {}).flat().includes(ticket.id);
                        const isEliminated = draw.status === 'announcing' && !Object.values(draw.roundWinners || {}).flat().includes(ticket.id);

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
              if (currentStage > stageNum && draw.announcedWinners?.[stageNum]) {
                return (
                  <RoundResultsCard 
                    key={`past-round-${stageNum}`}
                    title={STAGE_CONFIG[stageNum as keyof typeof STAGE_CONFIG].title} 
                    tickets={getTicketsByIds(draw.announcedWinners[stageNum], allTickets)}
                  />
                )
              }
              return null;
            })}
       </div>
    </div>
  );
}
