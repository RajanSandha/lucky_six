
export type User = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  ticketIds: string[];
  role: 'admin' | 'user'; // Explicitly add role
  referralCode?: string;
  referralsMade?: number;
};

export type Ticket = {
  id: string;
  drawId: string;
  userId: string;
  numbers: string; // A six-digit string e.g., "123456"
  purchaseDate: Date;
  isReferral?: boolean;
};

export type FullTicket = Ticket & { user: User | null };

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
  prizeStatus?: 'pending_confirmation' | 'address_confirmed' | 'packed' | 'shipped' | 'delivered';
  roundWinners?: Record<number, string[]>; // Stores all winners for each round, selected at once.
  announcedWinners?: Record<number, string[]>; // Stores winners as they are announced dramatically.
  referralAvailable?: boolean;
  [key: string]: any;
};
