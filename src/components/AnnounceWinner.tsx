
"use client";

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useAnnouncementData, useCeremonyState } from './announcement/hooks';
import AwaitingCeremonyDisplay from './announcement/AwaitingCeremonyDisplay';
import FinishedDrawDisplay from './announcement/FinishedDrawDisplay';
import GrandFinale from './announcement/GrandFinale';
import { AnnouncingDisplay } from './announcement/AnnouncingDisplay';

export function AnnounceWinner({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const { draw, allTickets, loading, error } = useAnnouncementData(params.id);
    const { 
        viewState, 
        setViewState, 
        revealingTicketId, 
        handleRevealComplete,
        currentStage,
        isIntermission
    } = useCeremonyState(draw);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }
    if (error) {
        return <div className="container mx-auto py-12 px-4 text-center text-destructive">{error}</div>;
    }
    if (!draw) {
        return <div className="container mx-auto py-12 px-4 text-center">Draw data is not available.</div>;
    }

    if (viewState === 'awaiting') {
        return <AwaitingCeremonyDisplay draw={draw} />;
    }

    if (viewState === 'finished') {
        return <FinishedDrawDisplay draw={draw} allTickets={allTickets} />;
    }
    
    if (viewState === 'finale') {
        return <GrandFinale 
                   draw={draw} 
                   allTickets={allTickets} 
                   onComplete={() => setViewState('finished')} 
               />;
    }
    
    return (
        <AnnouncingDisplay 
            draw={draw}
            allTickets={allTickets}
            user={user}
            revealingTicketId={revealingTicketId}
            onRevealComplete={handleRevealComplete}
            currentStage={currentStage}
            isIntermission={isIntermission}
        />
    );
}
