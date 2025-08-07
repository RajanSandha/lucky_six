
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Check, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { FullTicket } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { TicketCard } from '../TicketCard';
import { STAGE_CONFIG } from './utils';

export default function RoundCompletedDisplay({
    stage,
    stageConfig,
    tickets
}: {
    stage: number;
    stageConfig: (typeof STAGE_CONFIG)[keyof typeof STAGE_CONFIG];
    tickets: FullTicket[];
}) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center text-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                     <CheckCircle className="h-12 w-12 text-primary"/>
                </div>
                <h1 className="text-3xl font-bold font-headline text-primary">
                    {stageConfig.title} Complete!
                </h1>
                <p className="text-muted-foreground mt-2">Congratulations to the qualifiers! Here are the winners from this round.</p>
            </motion.div>

            <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 my-8"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {tickets.map(ticket => (
                    <motion.div
                        key={ticket.id}
                        variants={{
                            hidden: { opacity: 0, scale: 0.8 },
                            visible: { opacity: 1, scale: 1 }
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 20
                        }}
                        className="animate-pulse"
                        style={{animationIterationCount: 5}}
                    >
                         <TicketCard
                            ticket={ticket}
                            isSelected={true}
                            round={stage}
                        />
                    </motion.div>
                ))}
            </motion.div>
            
            <div className="w-full max-w-md">
                <p className="text-sm font-semibold mb-2">Preparing Next Round...</p>
                <Progress value={progress} className="w-full transition-all duration-[9000ms] ease-linear" />
            </div>
        </div>
    );
}
