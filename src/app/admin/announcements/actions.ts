
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Draw } from '@/lib/types';

export async function getAllAnnouncements(): Promise<Draw[]> {
  const drawsCol = collection(db, 'draws');
  
  // Order by announcementDate to separate upcoming and past draws
  const q = query(
    drawsCol,
    orderBy('announcementDate', 'desc')
  );

  const drawSnapshot = await getDocs(q);

  const drawList = drawSnapshot.docs
    .map(doc => {
        const data = doc.data();
        const endDate = data.endDate.toDate();
        return {
            id: doc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: endDate,
            announcementDate: data.announcementDate ? data.announcementDate.toDate() : new Date(endDate.getTime() + 2 * 60 * 60 * 1000),
            createdAt: data.createdAt?.toDate(),
        } as Draw;
    });

  return drawList;
}
