import type { User, Ticket, Draw } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alice', phone: '+919876543210', ticketIds: ['ticket-1', 'ticket-4'] },
  { id: 'user-2', name: 'Bob', phone: '+919876543211', ticketIds: ['ticket-2', 'ticket-winner-2'] },
  { id: 'user-3', name: 'Charlie', phone: '+919876543212', ticketIds: ['ticket-3', 'ticket-winner-3'] },
  { id: 'user-4', name: 'Diana', phone: '+919876543213', ticketIds: ['ticket-winner-4'] },
];

export const draws: Draw[] = [
  {
    id: '1',
    name: 'Mega Million Draw',
    description: 'The biggest draw of the year! Your chance to win a life-changing amount.',
    prize: 10000000,
    ticketPrice: 10,
    startDate: new Date('2024-08-01'),
    endDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  },
  {
    id: '2',
    name: 'Weekly Bonanza',
    description: 'A weekly draw with great odds and a handsome prize.',
    prize: 500000,
    ticketPrice: 5,
    startDate: new Date(new Date().getTime() - 8 * 24 * 60 * 60 * 1000),
    endDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
    winningTicketId: 'ticket-winner-2',
    winnerId: 'user-2',
  },
  {
    id: '3',
    name: 'Monsoon Special',
    description: 'Brighten up the rainy season with a special win.',
    prize: 250000,
    ticketPrice: 2,
    startDate: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(new Date().getTime() - 8 * 24 * 60 * 60 * 1000),
    winningTicketId: 'ticket-winner-3',
    winnerId: 'user-3',
  },
    {
    id: '4',
    name: 'Flash Draw',
    description: 'A quick draw with a fun prize.',
    prize: 100000,
    ticketPrice: 1,
    startDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
    winningTicketId: 'ticket-winner-4',
    winnerId: 'user-4',
  }
];

export const tickets: Ticket[] = [
  { id: 'ticket-1', drawId: '1', userId: 'user-1', numbers: '123456', purchaseDate: new Date() },
  { id: 'ticket-2', drawId: '1', userId: 'user-2', numbers: '789012', purchaseDate: new Date() },
  { id: 'ticket-3', drawId: '1', userId: 'user-3', numbers: '345678', purchaseDate: new Date() },
  { id: 'ticket-4', drawId: '2', userId: 'user-1', numbers: '987654', purchaseDate: new Date() },
  { id: 'ticket-winner-2', drawId: '2', userId: 'user-2', numbers: '112233', purchaseDate: new Date() },
  { id: 'ticket-winner-3', drawId: '3', userId: 'user-3', numbers: '555888', purchaseDate: new Date() },
  { id: 'ticket-winner-4', drawId: '4', userId: 'user-4', numbers: '777777', purchaseDate: new Date() },
];