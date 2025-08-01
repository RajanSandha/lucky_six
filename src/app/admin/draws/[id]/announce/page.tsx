

import { getDraw } from '@/app/admin/draws/actions';
import { notFound } from 'next/navigation';
import { AnnounceWinner } from '@/components/AnnounceWinner';
import { getTicketsForDraw } from './actions';
import type { Draw } from '@/lib/types';
import { auth } from '@/lib/firebase-admin'; // Using admin-sdk for server-side auth if needed
import { cookies } from 'next/headers';


export default async function AnnounceWinnerPage({ params }: { params: { id: string } }) {
    const { id } = params;
  
    const draw = await getDraw(id);
    
    if (!draw) {
        notFound();
    }
    
    // The component now fetches its own data, so we can just render it directly
    return <AnnounceWinner params={{ id }} />;
}
