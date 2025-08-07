
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Draw, Ticket, User, FullTicket } from '@/lib/types';
import { STAGE_CONFIG } from './utils';

export function useAnnouncementData(drawId: string) {
    const [draw, setDraw] = useState<Draw | null>(null);
    const [allTickets, setAllTickets] = useState<FullTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!drawId) {
            setError("No draw ID provided.");
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const ticketsQuery = query(collection(db, 'tickets'), where('drawId', '==', drawId));
                const ticketsSnapshot = await getDocs(ticketsQuery);
                const allTicketsData = await Promise.all(ticketsSnapshot.docs.map(async (docSnapshot) => {
                    const ticketData = { id: docSnapshot.id, ...docSnapshot.data() } as Ticket;
                    let userData: User | null = null;
                    if (ticketData.userId) {
                        const userRef = doc(db, 'users', ticketData.userId);
                        const userSnap = await getDoc(userRef);
                        userData = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as User : null;
                    }
                    return { ...ticketData, user: userData, purchaseDate: ticketData.purchaseDate };
                }));
                setAllTickets(allTicketsData);
            } catch (e: any) {
                setError(`Failed to load ticket data: ${e.message}`);
            } finally {
                 setLoading(false);
            }
        };

        fetchInitialData();

        const unsub = onSnapshot(doc(db, "draws", drawId), (doc) => {
            if (doc.exists()) {
                const data = doc.data() as any;
                const newDrawData: Draw = {
                    ...data,
                    id: doc.id,
                    startDate: data.startDate?.toDate(),
                    endDate: data.endDate?.toDate(),
                    announcementDate: data.announcementDate?.toDate(),
                };
                setDraw(newDrawData);
            } else {
                setError("Draw not found.");
            }
            if(loading) setLoading(false);
        });

        return () => unsub();
    }, [drawId]);

    return { draw, allTickets, loading, error };
}


function getCurrentStage(draw: Draw | null): number {
    if (!draw) return 1;

    let currentStage = 1;
    if(draw.announcedWinners && draw.roundWinners) {
        const roundKeys = Object.keys(draw.roundWinners).map(Number).sort();
        for(const s of roundKeys) {
            if (s > 4) continue; 
            const stageConfig = STAGE_CONFIG[s as keyof typeof STAGE_CONFIG];
            if (!stageConfig) continue;

            const announcedForStage = draw.announcedWinners[s] || [];
            if (announcedForStage.length < stageConfig.count) {
                currentStage = s;
                break;
            }
            if (announcedForStage.length === stageConfig.count) {
                currentStage = s + 1;
            }
        }
    }
    return currentStage;
}

export function useCeremonyState(draw: Draw | null) {
    const [viewState, setViewState] = useState<'awaiting' | 'announcing' | 'finale' | 'finished'>('awaiting');
    const [revealingTicketId, setRevealingTicketId] = useState<string | null>(null);
    const [revealedWinnerIds, setRevealedWinnerIds] = useState<Set<string>>(new Set());
    const [currentStage, setCurrentStage] = useState(1);
    const [isIntermission, setIsIntermission] = useState(false);
    const intermissionTimer = useRef<NodeJS.Timeout | null>(null);

    const handleRevealComplete = useCallback((ticketId: string) => {
        setRevealedWinnerIds(prev => new Set(prev).add(ticketId));
        setRevealingTicketId(null);
    }, []);

    useEffect(() => {
        if (!draw) return;

        // Cleanup any running timers on re-render
        if (intermissionTimer.current) {
            clearTimeout(intermissionTimer.current);
            intermissionTimer.current = null;
        }

        const stage = getCurrentStage(draw);
        setCurrentStage(stage);

        if (draw.status === 'finished') {
            if (viewState !== 'finale' && viewState !== 'finished') setViewState('finished');
            return;
        }
        
        if (draw.status === 'announcing' || (draw.announcedWinners && Object.keys(draw.announcedWinners).length > 0)) {
            const announcedRounds = Object.keys(draw.announcedWinners || {}).map(Number);
            const semiFinalAnnounced = announcedRounds.includes(3) && draw.announcedWinners![3].length === STAGE_CONFIG[3].count;
            
            if (semiFinalAnnounced) {
                if (viewState !== 'finale') setViewState('finale');
                return;
            }

            if (viewState !== 'announcing') setViewState('announcing');

            // --- Intermission Logic ---
            const prevStage = stage - 1;
            const isCurrentStageStarted = (draw.announcedWinners?.[stage]?.length || 0) > 0 || !!revealingTicketId;

            if (prevStage > 0 && prevStage < 4) {
                const prevStageConfig = STAGE_CONFIG[prevStage as keyof typeof STAGE_CONFIG];
                const announcedInPrevStage = draw.announcedWinners?.[prevStage]?.length || 0;
                const isPrevStageComplete = announcedInPrevStage === prevStageConfig.count;

                if (isPrevStageComplete && !isCurrentStageStarted && !isIntermission) {
                    setIsIntermission(true);
                    intermissionTimer.current = setTimeout(() => {
                        setIsIntermission(false);
                        intermissionTimer.current = null;
                    }, 10000); // 10 second intermission
                    return; // Return here to show intermission screen
                }
            }
            
            if (isIntermission && isCurrentStageStarted) {
                setIsIntermission(false);
            }

            if(isIntermission) return; // Don't proceed to reveal logic if in intermission


            // --- Reveal Logic ---
            const allAnnouncedWinners = Object.values(draw.announcedWinners || {}).flat();
            const previouslyRevealedIds = new Set([...revealedWinnerIds, ...allAnnouncedWinners.filter(id => id !== revealingTicketId)]);
            const newWinner = allAnnouncedWinners.find(id => !previouslyRevealedIds.has(id));

            if (newWinner && !revealingTicketId) {
                setRevealingTicketId(newWinner);
            }

        } else {
             if (viewState !== 'awaiting') {
                const now = new Date();
                const announcementDate = draw.announcementDate ? new Date(draw.announcementDate) : null;
                if (announcementDate && now >= announcementDate) {
                    if (viewState !== 'announcing') setViewState('announcing');
                } else {
                    if (viewState !== 'awaiting') setViewState('awaiting');
                }
            }
        }
        
        return () => {
             if (intermissionTimer.current) {
                clearTimeout(intermissionTimer.current);
             }
        }

    }, [draw, revealedWinnerIds, revealingTicketId, viewState, isIntermission]);

    return { 
        viewState, setViewState, 
        revealingTicketId, setRevealingTicketId, 
        handleRevealComplete,
        currentStage,
        isIntermission
    };
}
