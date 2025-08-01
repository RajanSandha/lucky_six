
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Draw, Ticket, User } from '@/lib/types';
import { Button } from './ui/button';
import { TicketCard } from './TicketCard';
import { setWinner } from '@/app/admin/draws/[id]/announce/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, PartyPopper } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { NumberRoller } from './NumberRoller';
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
  [STAGES.IDLE]: { title: 'Starting the Draw...', subTitle: 'Get ready for the first round!', nextStage: STAGES.QUALIFIER, buttonText: 'Start First Round' },
  [STAGES.QUALIFIER]: { title: 'First Round Selection', subTitle: 'Finding our top 20 qualifiers...', nextCount: 20, nextStage: STAGES.QUARTER_FINAL, duration: 500, animationDelay: 1000, buttonText: 'Start Quarter-Final' },
  [STAGES.QUARTER_FINAL]: { title: 'Quarter-Final', subTitle: 'Selecting 10 tickets to advance...', nextCount: 10, nextStage: STAGES.SEMI_FINAL, duration: 400, animationDelay: 500, buttonText: 'Start Semi-Final' },
  [STAGES.SEMI_FINAL]: { title: 'Semi-Final', subTitle: 'Finding our 3 finalists...', nextCount: 3, nextStage: STAGES.FINAL, duration: 800, animationDelay: 1000, buttonText: 'Start Final Round' },
  [STAGES.FINAL]: { title: 'The Final Round!', subTitle: 'And the winner is...', nextCount: 1, nextStage: STAGES.WINNER, duration: 1500, animationDelay: 5000, buttonText: 'Reveal Winner' },
  [STAGES.WINNER]: { title: 'We Have a Winner!', buttonText: 'Finish' },
};

type FullTicket = Ticket & { user: User | null };

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

function AnnounceWinnerComponent({ draw, allTickets }: { draw: Draw; allTickets: FullTicket[] }) {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPool, setCurrentPool] = useState<FullTicket[]>(allTickets);
  const [selectedForRound, setSelectedForRound] = useState<FullTicket[]>([]);
  const [highlightedTicket, setHighlightedTicket] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const [rollingNumbers, setRollingNumbers] = useState<string[]>(Array(6).fill('0'));
  const [isRolling, setIsRolling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);

  const currentStageConfig = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
  const winner = useMemo(() => stage === STAGES.WINNER ? currentPool[0] : null, [stage, currentPool]);

  // This is the core animation for a single ticket
  const runSlotMachine = useCallback((ticket: FullTicket) => {
    return new Promise<void>(resolve => {
        setIsRolling(true);
        setRollingNumbers(ticket.numbers.split(''));
        setRevealedIndices([]);
        
        const revealNumber = (index: number) => {
            if (index >= 6) {
                // All numbers revealed
                setTimeout(() => {
                    setIsRolling(false);
                    setHighlightedTicket(ticket.id);
                    // Short pause to see the highlighted ticket in the main pool
                    setTimeout(() => {
                      setSelectedForRound(prev => [...prev, ticket]);
                      setHighlightedTicket(null);
                      resolve();
                    }, 500); // 0.5s highlight
                }, 500); // Wait after last number
                return;
            }
            
            // Reveal one number
            setRevealedIndices(prev => [...prev, index]);
            
            // Schedule the next number reveal
            setTimeout(() => revealNumber(index + 1), 500);
        };

        // Start the rolling animation
        setTimeout(() => revealNumber(0), 100);
    });
  }, []);


  const runStage = useCallback(async () => {
      if (isProcessing || !currentStageConfig.nextCount) return;

      setIsProcessing(true);
      
      const shuffled = shuffleArray([...currentPool]);
      const nextRoundTickets = shuffled.slice(0, currentStageConfig.nextCount);
      
      for (const ticket of nextRoundTickets) {
        await runSlotMachine(ticket);
      }
      
      setCurrentPool(nextRoundTickets);
      setIsProcessing(false);
  }, [stage, isProcessing, currentPool, runSlotMachine, currentStageConfig.nextCount]);

  useEffect(() => {
    // Auto-start the very first round only
    if (stage === STAGES.QUALIFIER && !isProcessing && selectedForRound.length === 0) {
        runStage();
    }
  }, [stage, isProcessing, selectedForRound.length, runStage]);


  const handleNextStageClick = () => {
    if (isProcessing || stage === STAGES.WINNER) return;
    
    const nextStageKey = currentStageConfig.nextStage;
    if (nextStageKey) {
        setSelectedForRound([]); // Clear selections for the new round
        setStage(nextStageKey);
    }
  }
  
  const handleFinish = async () => {
     if (winner) {
          const result = await setWinner(draw.id, winner.id, winner.userId as string);
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
        <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit mb-6">
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
            {isProcessing ? (currentStageConfig.subTitle || `Draw: ${draw.name} | Total Tickets: ${allTickets.length}`) : `Ready for the next round?`}
        </p>
         {!isProcessing && stage !== STAGES.IDLE && stage !== STAGES.WINNER && stage !== STAGES.QUALIFIER && (
            <Button onClick={handleNextStageClick} disabled={isProcessing} className="mt-4">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStageConfig.buttonText}
            </Button>
        )}
         {stage === STAGES.IDLE && (
             <Button onClick={handleNextStageClick} disabled={isProcessing} className="mt-4">
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStageConfig.buttonText}
            </Button>
         )}
      </div>
      
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
                  <CardTitle className="font-headline text-blue-600">Selected Tickets ({selectedForRound.length} / {currentStageConfig.nextCount || 0})</CardTitle>
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
                <CardTitle>Ticket Pool ({currentPool.length})</CardTitle>
                <CardDescription>All tickets currently in the running for this round.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {allTickets.map(ticket => {
                    const isSelected = selectedForRound.some(t => t.id === ticket.id);
                    const isInCurrentPool = currentPool.some(p => p.id === ticket.id);
                    const isEliminated = !isInCurrentPool && stage !== STAGES.IDLE;

                    return (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            isEliminated={isEliminated && !isSelected}
                            isHighlighted={highlightedTicket === ticket.id}
                            isSelected={isSelected}
                        />
                    );
                })}
            </CardContent>
        </Card>
    </div>
  );
}


export const AnnounceWinner = withAdminAuth(AnnounceWinnerComponent);
