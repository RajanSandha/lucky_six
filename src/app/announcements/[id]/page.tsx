

import { getDraw } from '@/app/admin/draws/actions';
import { notFound } from 'next/navigation';
import { AnnounceWinner } from '@/components/AnnounceWinner';

export default async function AnnounceWinnerPublicPage({ params }: { params: { id: string } }) {
    const { id } = params;
  
    const draw = await getDraw(id);
    
    if (!draw) {
        notFound();
    }
    
    return <AnnounceWinner params={{ id }} />;
}
