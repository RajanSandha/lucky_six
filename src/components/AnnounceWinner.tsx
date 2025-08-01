"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { Button } from './ui/button';
import { TicketCard } from './TicketCard';
import { setWinner } from '@/app/admin/draws/[id]/announce/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, PartyPopper, Ticket as TicketIcon } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const STAGES = {
  IDLE: 'idle',
  QUALIFIER: 'qualifier',
  QUARTER_FINAL: 'quarter-final',
  SEMI_FINAL: 'semi-final',
  FINAL: 'final',
  WINNER: 'winner',
};

const STAGE_CONFIG = {
  [STAGES.IDLE]: { title: 'Starting the Draw...', subTitle: 'Get ready for the first round!', nextStage: STAGES.QUALIFIER },
  [STAGES.QUALIFIER]: { title: 'First Round Selection', subTitle: 'Finding our top 20 qualifiers...', nextCount: 20, nextStage: STAGES.QUARTER_FINAL, duration: 200 },
  [STAGES.QUARTER_FINAL]: { title: 'Quarter-Final', subTitle: 'Selecting 10 tickets to advance...', nextCount: 10, nextStage: STAGES.SEMI_FINAL, duration: 400 },
  [STAGES.SEMI_FINAL]: { title: 'Semi-Final', subTitle: 'Finding our 3 finalists...', nextCount: 3, nextStage: STAGES.FINAL, duration: 800 },
  [STAGES.FINAL]: { title: 'The Final Round!', subTitle: 'And the winner is...', nextCount: 1, nextStage: STAGES.WINNER, duration: 1500 },
  [STAGES.WINNER]: { title: 'We Have a Winner!', buttonText: 'Finish' },
};

type FullTicket = Ticket & { user: User | null };

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export function AnnounceWinner({ draw, allTickets }: { draw: Draw; allTickets: FullTicket[] }) {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [isProcessing, setIsProcessing] = useState(true);
  const [currentPool, setCurrentPool] = useState<FullTicket[]>(allTickets);
  const [selectedForRound, setSelectedForRound] = useState<FullTicket[]>([]);
  const [highlightedTicket, setHighlightedTicket] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const currentStageConfig = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
  const winner = useMemo(() => stage === STAGES.WINNER ? selectedForRound[0] : null, [stage, selectedForRound]);

  const runStage = async (currentStage: string, ticketsInPool: FullTicket[]) => {
      setIsProcessing(true);
      const stageConfig = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];
      if (!stageConfig || !stageConfig.nextCount) {
          setIsProcessing(false);
          return;
      };

      const shuffled = shuffleArray([...ticketsInPool]);
      const nextSelected = shuffled.slice(0, stageConfig.nextCount);

      // Simulate selection animation
      for (let i = 0; i < nextSelected.length; i++) {
        await new Promise(resolve => setTimeout(resolve, stageConfig.duration));
        setHighlightedTicket(nextSelected[i].id);
        await new Promise(resolve => setTimeout(resolve, 100)); // brief highlight
        setSelectedForRound(prev => [...prev, nextSelected[i]]);
        setHighlightedTicket(null);
      }
      
      setCurrentPool(nextSelected);
      setStage(stageConfig.nextStage as string);
      setIsProcessing(false);
  }

  useEffect(() => {
    // Automatically start the first round
    setTimeout(() => {
        setStage(STAGES.QUALIFIER);
        runStage(STAGES.QUALIFIER, allTickets);
    }, 2000); // 2-second delay before starting
  }, []);

  const handleNextStageClick = () => {
    if (!isProcessing && stage !== STAGES.WINNER) {
        setSelectedForRound([]);
        runStage(stage, currentPool);
    }
  }
  
  const handleFinish = async () => {
     if (winner) {
          const result = await setWinner(draw.id, winner.id, winner.userId);
          if (result.success) {
              toast({ title: 'Winner Announced!', description: 'The draw results have been updated.'});
          } else {
              toast({ title: 'Error', description: result.message, variant: 'destructive'});
          }
      }
  }

  if (winner) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-center p-4 overflow-hidden">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
        <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit mb-6 animate-pulse">
            <Crown className="h-16 w-16 text-primary"/>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary">
          Congratulations!
        </h1>
        <p className="text-2xl md:text-4xl font-semibold mt-4">{winner.user?.name || 'Anonymous'}</p>
        <p className="text-muted-foreground mt-2 mb-6">You've won the "{draw.name}" draw!</p>
        <div className="my-8">
            <p className="text-muted-foreground">Winning Ticket</p>
            <TicketCard ticket={winner} isWinner={true} />
        </div>
        <Button onClick={handleFinish} size="lg">
          <PartyPopper className="mr-2 h-4 w-4" />
           Finish & Update Results
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">
          {currentStageConfig.title}
        </h1>
        <p className="text-muted-foreground mt-2">
            {isProcessing ? currentStageConfig.subTitle : `Draw: ${draw.name} | Total Tickets: ${allTickets.length}`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-red-500/5 border-red-500/20">
              <CardHeader>
                  <CardTitle className="font-headline text-red-600">Slot Machine</CardTitle>
                  <CardDescription>Selecting the next winner...</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                    <p>Selecting ticket...</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Ready for next round.</p>
                    <Button onClick={handleNextStageClick} disabled={isProcessing} className="mt-4">
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start Next Round'}
                    </Button>
                  </div>
                )}
              </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-blue-500/5 border-blue-500/20">
              <CardHeader>
                  <CardTitle className="font-headline text-blue-600">Selected Tickets ({selectedForRound.length} / {currentStageConfig.nextCount || 'N/A'})</CardTitle>
                  <CardDescription>These tickets have advanced to the next stage.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 {selectedForRound.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} isSelected={true}/>
                 ))}
              </CardContent>
          </Card>
      </div>
      
       <Card className="mt-6">
            <CardHeader>
                <CardTitle>Ticket Pool</CardTitle>
                <CardDescription>All tickets currently in the running.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {currentPool.map(ticket => (
                    <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        isEliminated={isProcessing && highlightedTicket === ticket.id}
                        isHighlighted={highlightedTicket === ticket.id}
                    />
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
