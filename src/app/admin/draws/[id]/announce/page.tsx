import { getDraw } from '@/app/admin/draws/actions';
import { notFound } from 'next/navigation';
import { AnnounceWinner } from '@/components/AnnounceWinner';
import { getTicketsForDraw } from './actions';
import withAdminAuth from '@/components/withAdminAuth';


async function AnnounceWinnerPage({ params }: { params: { id: string } }) {
  const draw = await getDraw(params.id);
  
  if (!draw) {
    notFound();
  }

  const tickets = await getTicketsForDraw(params.id);

  return <AnnounceWinner draw={draw} tickets={tickets} />;
}

export default withAdminAuth(AnnounceWinnerPage);
