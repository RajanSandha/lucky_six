
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function purchaseTicket(drawId: string, userId: string, ticketNumber: string, isReferral: boolean) {
    try {
        // First, check if the ticket already exists for this draw
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('drawId', '==', drawId), where('numbers', '==', ticketNumber));
        const existingTicketSnap = await getDocs(q);

        if (!existingTicketSnap.empty) {
            return { success: false, message: 'This ticket number is already taken. Please choose another.' };
        }

        // Create the new ticket
        const newTicketData = {
            drawId,
            userId,
            numbers: ticketNumber,
            purchaseDate: serverTimestamp(),
            isReferral: isReferral || false,
        };
        const docRef = await addDoc(ticketsRef, newTicketData);
        
        // Add ticket reference to the user's document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ticketIds: arrayUnion(docRef.id)
        });


        revalidatePath(`/draws/${drawId}`);

        return { success: true, message: 'Ticket purchased successfully!', ticketId: docRef.id };
    } catch (error: any) {
        console.error('Error purchasing ticket:', error);
        return { success: false, message: `Failed to purchase ticket: ${error.message}` };
    }
}
