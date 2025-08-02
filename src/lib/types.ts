export type User = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  ticketIds: string[];
  isAdmin?: boolean;
  role?: string;
};

export type Ticket = {
  id: string;
  drawId: string;
  userId: string;
  numbers: string; // A six-digit string e.g., "123456"
  purchaseDate: Date;
};

export type Draw = {
  id: string;
  name: string;
  description: string;
  prize: number;
  ticketPrice: number;
  startDate: Date;
  endDate: Date;
  announcementDate: Date; // New field for scheduling
  winningTicketId?: string;
  winnerId?: string;
  imageUrl?: string;
  status?: 'upcoming' | 'active' | 'awaiting_announcement' | 'announcing' | 'finished';
  roundWinners?: Record<number, string[]>; // Stores all winners for each round, selected at once.
  announcedWinners?: Record<number, string[]>; // Stores winners as they are announced dramatically.
  [key: string]: any;
};
