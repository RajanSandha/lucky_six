
'use server';

import { revalidatePath } from 'next/cache';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, getDoc, deleteDoc, query, where, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Draw } from '@/lib/types';
import { scheduleWinnerSelection } from '@/ai/flows/schedule-winner-selection';

// Helper function to create a UTC date from a local datetime string
const createUtcDate = (dateString: string) => {
    if (!dateString) return new Date(); // Fallback, though should be handled by form validation
    // Append 'Z' to the string to tell the Date constructor that this time is in UTC
    return new Date(dateString + ':00.000Z');
}

async function uploadImage(image: File): Promise<string> {
    const storageRef = ref(storage, `draws/${Date.now()}-${image.name}`);
    await uploadBytes(storageRef, image);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

async function deleteImage(imageUrl: string) {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) return;
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error: any) {
        // We can ignore not found errors, as the image might have already been deleted
        if (error.code !== 'storage/object-not-found') {
            console.error("Error deleting image:", error);
        }
    }
}

export async function createDraw(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const prize = formData.get('prize') as string;
    const ticketPrice = formData.get('ticketPrice') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    let announcementDate = formData.get('announcementDate') as string;
    const imageFile = formData.get('image') as File | null;
    
    if (!name || !description || !prize || !ticketPrice || !startDate || !endDate) {
      return { success: false, message: 'Please fill out all required fields.' };
    }
    
    const endDateObj = createUtcDate(endDate);
    if (!announcementDate) {
        // Default announcement date to 2 hours after end date
        announcementDate = new Date(endDateObj.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
    }


    let imageUrl = 'https://placehold.co/600x400.png';

    if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImage(imageFile);
    }
    
    const newDrawData = {
      name,
      description,
      prize: Number(prize),
      ticketPrice: Number(ticketPrice),
      startDate: createUtcDate(startDate),
      endDate: endDateObj,
      announcementDate: createUtcDate(announcementDate),
      imageUrl: imageUrl,
      createdAt: serverTimestamp(),
      status: 'upcoming'
    };

    await addDoc(collection(db, "draws"), newDrawData);

    revalidatePath('/admin/draws');
    revalidatePath('/draws');
    revalidatePath('/');

    return { success: true, message: 'Draw created successfully!' };
  } catch (error: any) {
    console.error('Error creating draw:', error);
    return { success: false, message: `Failed to create draw: ${error.message}` };
  }
}

export async function updateDraw(drawId: string, formData: FormData) {
    try {
        const drawRef = doc(db, 'draws', drawId);
        const drawSnap = await getDoc(drawRef);

        if (!drawSnap.exists()) {
            return { success: false, message: 'Draw not found.' };
        }

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const prize = formData.get('prize') as string;
        const ticketPrice = formData.get('ticketPrice') as string;
        const startDate = formData.get('startDate') as string;
        const endDate = formData.get('endDate') as string;
        let announcementDate = formData.get('announcementDate') as string;
        const imageFile = formData.get('image') as File | null;

        if (!name || !description || !prize || !ticketPrice || !startDate || !endDate || !announcementDate) {
            return { success: false, message: 'Please fill out all required fields.' };
        }

        const updatedData: Partial<Draw> & { [key: string]: any } = {
            name,
            description,
            prize: Number(prize),
            ticketPrice: Number(ticketPrice),
            startDate: createUtcDate(startDate),
            endDate: createUtcDate(endDate),
            announcementDate: createUtcDate(announcementDate),
        };

        if (imageFile && imageFile.size > 0) {
            // Delete old image if it exists
            const oldImageUrl = drawSnap.data().imageUrl;
            if (oldImageUrl) {
                await deleteImage(oldImageUrl);
            }
            // Upload new image
            updatedData.imageUrl = await uploadImage(imageFile);
        }

        await updateDoc(drawRef, updatedData);

        revalidatePath('/admin/draws');
        revalidatePath(`/draws/${drawId}`);
        revalidatePath('/');

        return { success: true, message: 'Draw updated successfully!' };

    } catch (error: any) {
        console.error('Error updating draw:', error);
        return { success: false, message: `Failed to update draw: ${error.message}` };
    }
}

export async function deleteDraw(drawId: string) {
    try {
        const drawRef = doc(db, 'draws', drawId);
        const drawSnap = await getDoc(drawRef);

        if (!drawSnap.exists()) {
             return { success: false, message: 'Draw not found.' };
        }
        
        // Prevent deletion if draw is finished
        if (drawSnap.data().status === 'finished') {
            return { success: false, message: 'Cannot delete a completed draw.' };
        }

        // Check if any tickets have been purchased for this draw
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('drawId', '==', drawId), limit(1));
        const ticketSnapshot = await getDocs(q);

        if (!ticketSnapshot.empty) {
            return { success: false, message: 'Cannot delete draw with purchased tickets.' };
        }


        // Delete image from storage
        const imageUrl = drawSnap.data().imageUrl;
        if (imageUrl) {
            await deleteImage(imageUrl);
        }

        await deleteDoc(drawRef);

        revalidatePath('/admin/draws');
        revalidatePath('/draws');
        revalidatePath('/');

        return { success: true, message: 'Draw deleted successfully.' };

    } catch (error: any) {
        console.error('Error deleting draw:', error);
        return { success: false, message: `Failed to delete draw: ${error.message}` };
    }
}


export async function getDraws(): Promise<Draw[]> {
    const drawsCol = collection(db, 'draws');
    const drawSnapshot = await getDocs(drawsCol);
    const drawList = drawSnapshot.docs.map(doc => {
        const data = doc.data();
        const endDate = data.endDate.toDate();
        return {
            id: doc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: endDate,
            announcementDate: data.announcementDate ? data.announcementDate.toDate() : new Date(endDate.getTime() + 2 * 60 * 60 * 1000), // Default to 2 hr after end if not set
            createdAt: data.createdAt?.toDate()
        } as Draw;
    });
    // sort by end date descending
    return drawList.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
}

export async function getDraw(id: string): Promise<Draw | null> {
    const drawRef = doc(db, 'draws', id);
    const drawSnap = await getDoc(drawRef);
    if (drawSnap.exists()) {
        const data = drawSnap.data();
        const endDate = data.endDate.toDate();
        return {
            id: drawSnap.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: endDate,
            announcementDate: data.announcementDate ? data.announcementDate.toDate() : new Date(endDate.getTime() + 2 * 60 * 60 * 1000), // Default to 2 hr after end if not set
            createdAt: data.createdAt?.toDate()
        } as Draw;
    }
    return null;
}

export async function runScheduler() {
    try {
        const result = await scheduleWinnerSelection({ currentTime: new Date().toISOString() });
        revalidatePath('/admin/draws');
        revalidatePath('/admin/announcements');
        return { success: true, message: `Scheduler ran successfully. Processed ${result.processedDraws.length} draws.` };
    } catch (error: any) {
        console.error('Error running scheduler:', error);
        return { success: false, message: `Failed to run scheduler: ${error.message}` };
    }
}
