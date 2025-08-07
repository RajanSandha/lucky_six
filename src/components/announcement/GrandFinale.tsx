
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { cn } from '@/lib/utils';
import type { Draw, FullTicket } from '@/lib/types';
import { TicketCard } from '../TicketCard';
import { getTicketsByIds } from './utils';

export default function GrandFinale({ draw, allTickets, onComplete }: { draw: Draw, allTickets: FullTicket[], onComplete: () => void }) {
    const [countdown, setCountdown] = useState(5); // Start with a shorter countdown
    const [revealed, setRevealed] = useState(false);
    const { width, height } = useWindowSize();
    
    const finalists = getTicketsByIds(draw.roundWinners?.[3] || [], allTickets);
    const winner = getTicketsByIds(draw.roundWinners?.[4] || [], allTickets)[0] || null;

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (!revealed && winner) {
            setRevealed(true);
            const finalTimer = setTimeout(() => {
                window.location.reload();
            }, 8000); // Wait 8s before refreshing the page
            return () => clearTimeout(finalTimer);
        }
    }, [countdown, revealed, winner]);
    
    if (!revealed) {
        return (
            <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-8 p-4">
                <h2 className="text-4xl text-center font-headline font-bold text-primary">And the winner is...</h2>
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    {finalists.map(ticket => <TicketCard key={ticket.id} ticket={ticket} round={3} isFinalist={true}/>)}
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
                        <TicketCard ticket={ticket} round={winner ? (ticket.id === winner.id ? 4 : 3) : 3} isWinner={winner ? ticket.id === winner.id : false}/>
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
