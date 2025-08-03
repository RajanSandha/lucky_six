

import { getDraw } from '@/app/admin/draws/actions';
import { notFound } from 'next/navigation';
import { AnnounceWinner } from '@/components/AnnounceWinner';

export default async function AnnounceWinnerPage({ params }: { params: { id: string } }) {
    const { id } = params;
  
    const draw = await getDraw(id);
    
    if (!draw) {
        notFound();
    }
    
    // The component now fetches its own data, so we can just render it directly
    return <AnnounceWinner params={{ id }} />;
}

