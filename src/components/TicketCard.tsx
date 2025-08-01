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
}

export function TicketCard({ 
    ticket, 
    isEliminated = false, 
    isFinalist = false, 
    isWinner = false,
    isSelected = false,
    isHighlighted = false,
}: TicketCardProps) {

    const numbers = ticket.numbers.split('');

    return (
        <div className={cn(
            "p-2 md:p-4 rounded-lg border-2 bg-card shadow-sm transition-all duration-300 ease-in-out",
            isEliminated ? "border-destructive bg-destructive/10 opacity-30 transform scale-90" : "border-primary/20",
            isFinalist && !isWinner ? "animate-pulse border-accent shadow-accent/50 shadow-lg" : "",
            isWinner ? "border-accent bg-accent/10 shadow-accent/50 shadow-xl" : "",
            isSelected ? "border-blue-500 bg-blue-500/10" : "",
            isHighlighted ? "border-green-500 scale-110" : "",
        )}>
            <div className="flex justify-center gap-1 mb-2">
                {numbers.map((num, index) => (
                   <div
                        key={index}
                        className="w-5 h-6 sm:w-6 sm:h-8 text-sm md:text-lg flex items-center justify-center font-bold rounded-md border bg-primary/10 text-primary"
                    >
                        {num}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <UserIcon className="h-3 w-3" />
                <span className="font-medium truncate">{ticket.user?.name || 'Anonymous'}</span>
            </div>
        </div>
    );
}
