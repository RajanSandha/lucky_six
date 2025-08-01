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
}

export function TicketCard({ ticket, isEliminated = false, isFinalist = false, isWinner = false }: TicketCardProps) {

    const numbers = ticket.numbers.split('');

    return (
        <div className={cn(
            "p-4 rounded-lg border-2 bg-card shadow-sm transition-all duration-300 ease-in-out",
            isEliminated ? "border-destructive bg-destructive/10 opacity-30 transform scale-90" : "border-primary/20",
            isFinalist && !isWinner ? "animate-pulse border-accent shadow-accent/50 shadow-lg" : "",
            isWinner ? "border-accent bg-accent/10 shadow-accent/50 shadow-xl" : ""
        )}>
            <div className="flex justify-center gap-1 md:gap-2 mb-3">
                {numbers.map((num, index) => (
                   <NumberRoller
                        key={index}
                        finalNumber={num}
                        isRolling={isEliminated}
                        className="w-8 h-10 sm:w-10 sm:h-12 text-xl md:text-2xl"
                    />
                ))}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium truncate">{ticket.user?.name || 'Anonymous'}</span>
            </div>
        </div>
    );
}
