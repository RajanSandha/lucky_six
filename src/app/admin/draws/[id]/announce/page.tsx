import { getDraw } from '@/app/admin/draws/actions';
import { notFound } from 'next/navigation';
import { AnnounceWinner } from '@/components/AnnounceWinner';
import { getTicketsForDraw } from './actions';
import withAdminAuth from '@/components/withAdminAuth';
import type { Draw, Ticket, User } from '@/lib/types';

// Helper to generate a 6-digit string
const generate6DigitString = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

// Helper to create mock data for testing
const createMockData = (count: number): (Ticket & { user: User | null })[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `ticket-${i + 1}`,
    drawId: 'test-draw',
    userId: `user-${i + 1}`,
    numbers: generate6DigitString(),
    purchaseDate: new Date(),
    user: {
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      phone: `+9198765432${String(i).padStart(2, '0')}`,
      ticketIds: [],
    },
  }));
};


async function AnnounceWinnerPage({ params }: { params: { id: string } }) {
  if (params.id === 'test-draw') {
    const mockDraw: Draw = {
      id: 'test-draw',
      name: 'Super Special Test Draw',
      description: 'A draw for testing purposes.',
      prize: 1000000,
      ticketPrice: 50,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    };
    const mockTickets = createMockData(50);
    return <AnnounceWinner draw={mockDraw} tickets={mockTickets} />;
  }
  
  const draw = await getDraw(params.id);
  
  if (!draw) {
    notFound();
  }

  const tickets = await getTicketsForDraw(params.id);

  return <AnnounceWinner draw={draw} tickets={tickets} />;
}

export default withAdminAuth(AnnounceWinnerPage);
