export type User = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  ticketIds: string[];
  isAdmin?: boolean;
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
  winningTicketId?: string;
  winnerId?: string;
  imageUrl?: string;
};
