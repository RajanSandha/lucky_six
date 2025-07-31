'use server';

import { revalidatePath } from 'next/cache';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Draw } from '@/lib/types';

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
    const imageFile = formData.get('image') as File | null;
    let imageUrl = 'https://placehold.co/600x400.png';

    if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImage(imageFile);
    }
    
    const newDrawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      prize: Number(formData.get('prize')),
      ticketPrice: Number(formData.get('ticketPrice')),
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      imageUrl: imageUrl,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "draws"), newDrawData);

    revalidatePath('/admin/draws');
    revalidatePath('/draws');
    revalidatePath('/');

    return { success: true, message: 'Draw created successfully!' };
  } catch (error) {
    console.error('Error creating draw:', error);
    return { success: false, message: 'Failed to create draw.' };
  }
}


export async function getDraws(): Promise<Draw[]> {
    const drawsCol = collection(db, 'draws');
    const drawSnapshot = await getDocs(drawsCol);
    const drawList = drawSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            createdAt: data.createdAt?.toDate()
        } as Draw;
    });
    // sort by end date descending
    return drawList.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
}
