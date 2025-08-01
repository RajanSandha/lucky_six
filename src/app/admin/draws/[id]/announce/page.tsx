
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
    
    // This is a simplified way to get current user on server. 
    // In a real app, you'd get this from the session. We'll use a cookie for this example.
    const userCookie = cookies().get('lucky-six-user');
    const currentUser = userCookie ? JSON.parse(userCookie.value) : null;
    
    const tickets = await getTicketsForDraw(id, currentUser?.id);

    return <AnnounceWinner draw={draw} allTickets={tickets} />;
}
