
"use client";

import type { Ticket, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';
import { NumberRoller } from './NumberRoller';

type FullTicket = Ticket & { user: User | null };

interface TicketCardProps {
    ticket: FullTicket;
    isEliminated?: boolean;
    isFinalist?: boolean;
    isWinner?: boolean;
    isSelected?: boolean;
    isHighlighted?: boolean;
    isRevealing?: boolean;
    onRevealComplete?: () => void;
    round?: number; // 1: Qualifier, 2: Quarter-Final, 3: Semi-Final, 4: Winner
}

export function TicketCard({ 
    ticket, 
    isEliminated = false, 
    isFinalist = false, 
    isWinner = false,
    isSelected = false,
    isHighlighted = false,
    isRevealing = false,
    onRevealComplete,
    round = 0,
}: TicketCardProps) {

    const numbers = ticket.numbers.split('');
    
    const roundStyles = {
        0: "border-primary/20", // Default / Not selected
        1: "border-green-500 bg-green-500/10", // Qualifier
        2: "border-blue-500 bg-blue-500/10", // Quarter-Final
        3: "border-purple-500 bg-purple-500/10", // Semi-Final
        4: "border-accent bg-accent/20", // Winner
    };
    
    const numberStyles = {
        0: "bg-primary/10 border-primary/20 text-primary",
        1: "bg-green-500/10 border-green-500 text-green-700",
        2: "bg-blue-500/10 border-blue-500 text-blue-700",
        3: "bg-purple-500/10 border-purple-500 text-purple-700",
        4: "bg-accent/20 border-accent text-accent-foreground",
    }


    return (
        <div className={cn(
            "p-2 md:p-4 rounded-lg border-2 bg-card shadow-sm transition-all duration-300 ease-in-out",
            isSelected ? roundStyles[round as keyof typeof roundStyles] : "border-primary/20",
            isEliminated && !isSelected ? "border-destructive bg-destructive/10 opacity-30 transform scale-90" : "",
            isFinalist && !isWinner ? "animate-pulse border-purple-500 shadow-purple-500/50 shadow-lg" : "",
            isWinner ? "border-accent bg-accent/20 shadow-accent/50 shadow-xl" : "",
            isHighlighted ? "border-green-500 scale-110" : "",
        )}>
            <div className="flex justify-center gap-1 mb-2">
                {isRevealing ? (
                     Array.from({length: 6}).map((_, index) => (
                         <NumberRoller
                            key={index}
                            finalNumber={ticket.numbers[index]}
                            isRolling={true}
                            revealDelay={index * 400} // Staggered reveal
                            onRevealComplete={index === 5 ? onRevealComplete : undefined}
                        />
                     ))
                ) : (
                    numbers.map((num, index) => (
                       <div
                            key={index}
                            className={cn("w-6 h-8 sm:w-8 sm:h-10 text-sm md:text-lg flex items-center justify-center font-bold rounded-md border",
                            isSelected ? numberStyles[round as keyof typeof numberStyles] : numberStyles[0]
                            )}
                        >
                            {num}
                        </div>
                    ))
                )}
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <UserIcon className="h-3 w-3" />
                <span className="font-medium truncate">{ticket.user?.name || 'Anonymous'}</span>
            </div>
        </div>
    );
}
