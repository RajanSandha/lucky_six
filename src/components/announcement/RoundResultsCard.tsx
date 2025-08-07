
"use client";

import * as React from 'react';
import type { FullTicket } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketCard } from '../TicketCard';
import { STAGE_CONFIG } from './utils';

export function RoundResultsCard({ 
    title, 
    tickets, 
    stage, 
    isCurrentRound = false,
    revealingTicket,
    onRevealComplete,
    placeholdersCount
}: { 
    title: string; 
    tickets: FullTicket[]; 
    stage: number; 
    isCurrentRound?: boolean;
    revealingTicket?: FullTicket;
    onRevealComplete?: (id: string) => void;
    placeholdersCount?: number;
}) {
    const stageData = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
    const count = stageData.count;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-blue-600">{title} ({tickets.length} / {count})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tickets.map(ticket => (
                    <TicketCard
                        key={`revealed-${stage}-${ticket.id}`}
                        ticket={ticket}
                        isSelected={true}
                        round={stage}
                    />
                ))}
                {isCurrentRound && revealingTicket && onRevealComplete && (
                     <TicketCard
                        key={`revealing-${stage}-${revealingTicket.id}`}
                        ticket={revealingTicket}
                        isRevealing={true}
                        onRevealComplete={() => onRevealComplete(revealingTicket.id)}
                        isSelected={true}
                        round={stage}
                    />
                )}
                {isCurrentRound && Array.from({ length: placeholdersCount || 0 }).map((_, i) => (
                    <div key={`placeholder-${stage}-${i}`} className="p-2 md:p-4 rounded-lg border-2 bg-muted/50 shadow-sm border-dashed animate-pulse min-h-[76px]"/>
                ))}
            </CardContent>
        </Card>
    );
}
