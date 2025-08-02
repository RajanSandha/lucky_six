

"use client";

import { useState, useEffect } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { TicketCard } from './TicketCard';
import { getDraw } from '@/app/admin/draws/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, CheckCircle, Star, MoreHorizontal } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import withAdminAuth from './withAdminAuth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, limit } from 'firebase/firestore';
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
            
            <div className="block lg:hidden mb-6">
                 <Card className="text-center p-6 bg-primary/10 border-primary/20 flex flex-col justify-center items-center h-48">
                    <Star className="h-16 w-16 text-primary animate-pulse mb-4"/>
                    <p className={cn("text-xl font-semibold font-headline text-primary transition-opacity duration-500", isFading ? "opacity-0" : "opacity-100")}>
                        {positiveMessages[messageIndex]}
                    </p>
                </Card>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <main className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Pool ({hasMoreTickets ? '50+' : tickets.length})</CardTitle>
                            <CardDescription>A selection of tickets participating in this draw.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {tickets.map((ticket, index) => {
                                if (hasMoreTickets && index === tickets.length - 1) {
                                    return (
                                        <div key="more-tickets" className="relative p-2 md:p-4 rounded-lg border-2 bg-card shadow-sm border-dashed">
                                            <div className="flex justify-center items-center h-full blur-[2px] opacity-60">
                                                <TicketCard ticket={ticket} />
                                            </div>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50">
                                                 <MoreHorizontal className="h-6 w-6 text-muted-foreground"/>
                                                 <p className="text-xs font-semibold text-muted-foreground">More...</p>
                                            </div>
                                        </div>
                                    )
                                }
                                return (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                    />
                                );
                            })}
                        </CardContent>
                    </Card>
                 </main>
                 <aside className="hidden lg:block">
                    <div className="sticky top-24">
                        <Card className="text-center p-6 bg-primary/10 border-primary/20 h-96 flex flex-col justify-center items-center">
                            <Star className="h-16 w-16 text-primary animate-pulse mb-4"/>
                            <p className={cn("text-xl font-semibold font-headline text-primary-foreground transition-opacity duration-500", isFading ? "opacity-0" : "opacity-100")}>
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


function AnnounceWinnerComponent({ initialDraw, allTickets }: { initialDraw: Draw; allTickets: FullTicket[] }) {
  const [draw, setDraw] = useState(initialDraw);
  const { width, height } = useWindowSize();
  const { user } = useAuth();
  
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
    });
    return () => unsub();
  }, [draw.id]);


  const getCurrentStage = () => {
    if (!draw.announcedWinners) return 1;
    if (draw.announcedWinners[1]?.length < STAGE_CONFIG[1].count) return 1;
    if (draw.announcedWinners[2]?.length < STAGE_CONFIG[2].count) return 2;
    if (draw.announcedWinners[3]?.length < STAGE_CONFIG[3].count) return 3;
    if (draw.announcedWinners[4]?.length < STAGE_CONFIG[4].count) return 4;
    return 5; // Ceremony finished
  }

  const currentStage = getCurrentStage();
  const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];
  
  if (draw.status === 'finished') {
      return <FinishedDrawDisplay draw={draw} allTickets={allTickets} />
  }

  // This handles the "awaiting" state before the ceremony starts.
  if (draw.status !== 'announcing' || !draw.roundWinners) {
     const hasMoreTickets = allTickets.length > 50;
     const displayedTickets = allTickets.slice(0, 50);
    return <AwaitingCeremonyDisplay draw={draw} tickets={displayedTickets} hasMoreTickets={hasMoreTickets}/>
  }
    
  if (!stageConfig) {
      // This case handles when the ceremony is finished (currentStage = 5) but status is not yet 'finished'
      return (
        <div className="flex h-screen items-center justify-center">
            <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
            <Card className="text-center p-8">
                <CardHeader>
                     <div className="mx-auto bg-green-100 dark:bg-green-900/50 p-4 rounded-full w-fit">
                        <CheckCircle className="h-12 w-12 text-green-600"/>
                    </div>
                    <CardTitle className="text-2xl mt-4">Ceremony Complete!</CardTitle>
                    <CardDescription>All winners have been announced.</CardDescription>
                </CardHeader>
            </Card>
        </div>
      )
  }

  const announcedInStage = getTicketsByIds(draw.announcedWinners?.[currentStage] || [], allTickets);
  const roundIsComplete = announcedInStage.length === stageConfig.count;

  // Filter for the logged-in user's tickets for the bottom pool view
  const userTickets = allTickets.filter(t => t.userId === user?.id);

  return (
    <div className="container mx-auto py-12 px-4">
      {currentStage === 5 && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">
          {stageConfig.title}
        </h1>
        <p className="text-muted-foreground mt-2">
            {stageConfig.subTitle}
        </p>
      </div>
      
       {roundIsComplete && currentStage < 4 && (
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

      <Card className="lg:col-span-2 bg-blue-500/5 border-blue-500/20 mb-6">
          <CardHeader>
              <CardTitle className="font-headline text-blue-600">Selected This Round ({announcedInStage.length} / {stageConfig.count || 0})</CardTitle>
              <CardDescription>These tickets have advanced from the current stage.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
             {announcedInStage.map(ticket => (
                <TicketCard key={`revealed-${ticket.id}`} ticket={ticket} isSelected={true}/>
             ))}
             {!roundIsComplete && <div className="p-4 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          </CardContent>
      </Card>
       
       <Card className="mt-6">
            <CardHeader>
                <CardTitle>Your Tickets ({userTickets.length})</CardTitle>
                <CardDescription>Your tickets participating in this draw.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {userTickets.map(ticket => {
                    const isAnnounced = Object.values(draw.announcedWinners || {}).flat().includes(ticket.id);
                    const allRoundWinners = Object.values(draw.roundWinners || {}).flat();
                    const isInFutureRound = allRoundWinners.includes(ticket.id);
                    const isEliminated = !isInFutureRound;

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

                const isUpcoming = drawData.status !== 'announcing' && drawData.status !== 'finished';
                const ticketsQuery = isUpcoming 
                    ? query(collection(db, 'tickets'), where('drawId', '==', params.id), limit(51))
                    : query(collection(db, 'tickets'), where('drawId', '==', params.id));

                const ticketsSnapshot = await getDocs(ticketsQuery);
                const allTicketsData = await Promise.all(ticketsSnapshot.docs.map(async (docSnapshot) => {
                    const ticketData = { id: docSnapshot.id, ...docSnapshot.data() } as Ticket;
                    let user: User | null = null;
                    if (ticketData.userId) {
                        const userRef = doc(db, 'users', ticketData.userId);
                        const userSnap = await getDoc(userRef);
                        user = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as User : null;
                    }
                    return { ...ticketData, user, purchaseDate: ticketData.purchaseDate };
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

    
