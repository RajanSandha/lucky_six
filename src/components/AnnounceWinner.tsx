"use client";

import { useState, useMemo } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { Button } from './ui/button';
import { TicketCard } from './TicketCard';
import { setWinner } from '@/app/admin/draws/[id]/announce/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, PartyPopper } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import withAdminAuth from './withAdminAuth';

const STAGES = {
  IDLE: 'idle',
  QUALIFIER: 'qualifier',
  QUARTER_FINAL: 'quarter-final',
  SEMI_FINAL: 'semi-final',
  FINAL: 'final',
  WINNER: 'winner',
};

const STAGE_CONFIG = {
  [STAGES.IDLE]: { title: 'Start the Draw', buttonText: 'Begin Selection', nextStage: STAGES.QUALIFIER },
  [STAGES.QUALIFIER]: { title: 'Qualifier Round', subTitle: 'Selecting 20 tickets from the pool...', nextCount: 20, nextStage: STAGES.QUARTER_FINAL, duration: 200 },
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

function AnnounceWinnerComponent({ draw, tickets }: { draw: Draw; tickets: FullTicket[] }) {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<FullTicket[]>(tickets);
  const [highlightedTicket, setHighlightedTicket] = useState<string | null>(null);
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const currentStageConfig = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
  const winner = useMemo(() => stage === STAGES.WINNER ? selectedTickets[0] : null, [stage, selectedTickets]);

  const handleNextStage = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const nextStage = currentStageConfig.nextStage;
    if (!nextStage) {
      if (winner) {
          const result = await setWinner(draw.id, winner.id, winner.userId);
          if (result.success) {
              toast({ title: 'Winner Announced!', description: 'The draw results have been updated.'});
          } else {
              toast({ title: 'Error', description: result.message, variant: 'destructive'});
          }
      }
      return;
    }
    
    setStage(nextStage);
    const nextStageConfig = STAGE_CONFIG[nextStage as keyof typeof STAGE_CONFIG];
    
    const shuffled = shuffleArray([...selectedTickets]);
    const nextSelected = shuffled.slice(0, nextStageConfig.nextCount);
    const eliminated = shuffled.slice(nextStageConfig.nextCount);
    
    // Animation for elimination
    for (const ticket of eliminated) {
      await new Promise(resolve => setTimeout(resolve, nextStageConfig.duration / eliminated.length / 2));
      setHighlightedTicket(ticket.id);
      await new Promise(resolve => setTimeout(resolve, nextStageConfig.duration / eliminated.length / 2));
    }
    setHighlightedTicket(null);
    setSelectedTickets(nextSelected);

    setIsProcessing(false);
  };

  const getGridCols = () => {
    if (selectedTickets.length > 10) return 'md:grid-cols-5';
    if (selectedTickets.length > 4) return 'md:grid-cols-5';
    if (selectedTickets.length > 1) return 'md:grid-cols-3';
    return 'md:grid-cols-1';
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
        <Button onClick={handleNextStage} disabled={isProcessing} size="lg">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PartyPopper className="mr-2 h-4 w-4" />}
           Finish & Update Results
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
          {currentStageConfig.title}
        </h1>
        <p className="text-muted-foreground mt-2">
            {isProcessing ? currentStageConfig.subTitle : `Draw: ${draw.name} | Total Tickets: ${tickets.length}`}
        </p>
      </div>
      
      <div className="my-8">
        <div className={`grid grid-cols-2 ${getGridCols()} gap-4 transition-all duration-500`}>
            {selectedTickets.map(ticket => (
                <TicketCard 
                    key={ticket.id}
                    ticket={ticket}
                    isEliminated={isProcessing && highlightedTicket === ticket.id}
                    isFinalist={stage === STAGES.FINAL}
                />
            ))}
        </div>
      </div>
      
      {stage !== STAGES.IDLE && selectedTickets.length > 1 && (
        <div className="text-center my-4 text-muted-foreground animate-pulse">
          <p>{currentStageConfig.subTitle}</p>
        </div>
      )}

      <div className="text-center mt-12">
        <Button onClick={handleNextStage} disabled={isProcessing} size="lg">
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentStageConfig.buttonText || `Start Next Round (${currentStageConfig.nextStage})`}
        </Button>
      </div>
    </div>
  );
}


export const AnnounceWinner = withAdminAuth(AnnounceWinnerComponent);
