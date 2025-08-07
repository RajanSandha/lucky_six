
import type { FullTicket } from '@/lib/types';

export const STAGE_CONFIG = {
  1: { title: 'Qualifier Round', subTitle: 'Revealing the Top 20', count: 20 },
  2: { title: 'Quarter-Final', subTitle: 'Revealing the Top 10', count: 10 },
  3: { title: 'Semi-Final', subTitle: 'Revealing the 3 Finalists', count: 3 },
  4: { title: 'Final Round!', subTitle: 'The Grand Winner!', count: 1 },
};

export const WINNER_MESSAGES = [
    "Congratulations! Your lucky number came through!",
    "You're the grand prize winner! Unbelievable!",
    "Wow! You did it! Your ticket is the chosen one!",
    "Pop the confetti! You've won the main prize!",
    "Your luck has paid off! Congratulations on your big win!"
];

export const getTicketsByIds = (ids: string[], allTickets: FullTicket[]): FullTicket[] => {
    if (!ids || !allTickets) return [];
    const ticketMap = new Map(allTickets.map(t => [t.id, t]));
    return ids.map(id => ticketMap.get(id)).filter(Boolean) as FullTicket[];
};
