
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
                // Fetch all tickets for the draw once
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


export function useCeremonyState(draw: Draw | null) {
    const [viewState, setViewState] = useState<'awaiting' | 'announcing' | 'finale' | 'finished'>('awaiting');
    const [revealingTicketId, setRevealingTicketId] = useState<string | null>(null);
    const [revealedWinnerIds, setRevealedWinnerIds] = useState<Set<string>>(new Set());

    const handleRevealComplete = useCallback((ticketId: string) => {
        setRevealedWinnerIds(prev => new Set(prev).add(ticketId));
        setRevealingTicketId(null);
    }, []);

    useEffect(() => {
        if (!draw) return;

        // Determine current view state based on draw status
        if (draw.status === 'finished') {
            if (viewState !== 'finale' && viewState !== 'finished') {
                setViewState('finished');
            }
        } else if (draw.status === 'announcing' || (draw.announcedWinners && Object.keys(draw.announcedWinners).length > 0)) {
            const announcedRounds = Object.keys(draw.announcedWinners || {}).map(Number);
            const semiFinalAnnounced = announcedRounds.includes(3) && draw.announcedWinners![3].length === STAGE_CONFIG[3].count;
            
            if (semiFinalAnnounced) {
                if (viewState !== 'finale') {
                    setViewState('finale');
                }
                return;
            }
            if (viewState !== 'announcing') {
                setViewState('announcing');
            }


            const allAnnouncedWinners = Object.values(draw.announcedWinners || {}).flat();
            const previouslyRevealedIds = new Set([...revealedWinnerIds, ...allAnnouncedWinners.filter(id => id !== revealingTicketId)]);
            const newWinner = allAnnouncedWinners.find(id => !previouslyRevealedIds.has(id));


            if (newWinner && !revealingTicketId) {
                setRevealingTicketId(newWinner);
            }

        } else if (viewState !== 'awaiting') {
            // This logic ensures we check dates before setting to 'awaiting'
            const now = new Date();
            const announcementDate = draw.announcementDate ? new Date(draw.announcementDate) : null;
            if (announcementDate && now >= announcementDate) {
                 if (viewState !== 'announcing') setViewState('announcing');
            } else {
                 if (viewState !== 'awaiting') setViewState('awaiting');
            }
        }

    }, [draw, revealedWinnerIds, revealingTicketId, viewState]);

    return { viewState, setViewState, revealingTicketId, setRevealingTicketId, handleRevealComplete };
}
