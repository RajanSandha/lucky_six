'use server';

import { revalidatePath } from 'next/cache';
import { draws } from '@/lib/data';
import type { Draw } from '@/lib/types';

export async function createDraw(formData: FormData) {
  try {
    const newDraw: Draw = {
      id: (draws.length + 2).toString(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      prize: Number(formData.get('prize')),
      ticketPrice: Number(formData.get('ticketPrice')),
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      imageUrl: 'https://placehold.co/600x400.png' // Placeholder for now
    };

    // In a real app, you'd handle file upload and save this to a database.
    // For this prototype, we'll just log it.
    console.log('New Draw Created:', newDraw);
    // draws.push(newDraw); // This would modify the in-memory array, but won't persist across requests on the server.

    revalidatePath('/admin/draws');
    revalidatePath('/draws');
    revalidatePath('/');

    return { success: true, message: 'Draw created successfully!' };
  } catch (error) {
    console.error('Error creating draw:', error);
    return { success: false, message: 'Failed to create draw.' };
  }
}
