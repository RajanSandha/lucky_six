
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { TicketIcon } from 'lucide-react';
import type { Draw } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { utcToLocalString } from '@/lib/date-utils';
import { Card, CardContent } from '@/components/ui/card';

const AwaitingMessages = [
    "Verifying all entries...",
    "Cross-referencing tickets...",
    "Wishing you luck!",
    "The tension is mounting!",
    "Our system is ensuring fairness...",
    "Who will be the lucky winner?",
    "Could it be you?",
    "Final checks in progress."
];

export default function AwaitingCeremonyDisplay({ draw }: { draw: Draw }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % AwaitingMessages.length);
        }, 3000); // Change message every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const floatingTickets = Array.from({ length: 15 }).map((_, i) => {
        const style = {
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
        };
        return <TicketIcon key={i} className="absolute top-[-10%] text-primary/20 animate-fall" style={style} />;
    });

    return (
        <div className="relative container mx-auto py-12 px-4 h-[calc(100vh-10rem)] flex flex-col items-center justify-center overflow-hidden">
            {floatingTickets}
            <div className="text-center mb-8 z-10">
                <h1 className="text-3xl font-bold font-headline text-primary">The Ceremony Is About to Begin!</h1>
                <p className="text-muted-foreground mt-2">Winner selection starts on {utcToLocalString(new Date(draw.announcementDate), 'PPpp')}</p>
                 {user && <p className="text-lg font-semibold mt-4">Hang tight, {user.name}! The excitement is building.</p>}
            </div>
             <div className="flex justify-center z-10 w-full">
                 <Card className="w-full shadow-2xl bg-background/80 backdrop-blur-sm">
                    <CardContent className="text-center p-12 flex flex-col items-center gap-6">
                        <TicketIcon className="w-32 h-32 text-primary animate-pulse" style={{ animationDuration: '1.5s' }} />
                        <div className="relative h-8 w-full overflow-hidden">
                             {AwaitingMessages.map((msg, index) => (
                                <div
                                    key={msg}
                                    className={cn(
                                        "absolute w-full text-center text-xl font-semibold text-muted-foreground transition-all duration-500",
                                        index === messageIndex ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
                                    )}
                                >
                                    {msg}
                                </div>
                             ))}
                        </div>
                    </CardContent>
                 </Card>
            </div>
             <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
}
