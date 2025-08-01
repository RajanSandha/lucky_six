'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Draw } from '@/lib/types';

export async function getDrawsAwaitingWinner(): Promise<Draw[]> {
  const drawsCol = collection(db, 'draws');
  // Firestore doesn't support inequality filters on multiple fields,
  // so we fetch draws that haven't finished and filter in code.
  const q = query(drawsCol, where('status', '!=', 'finished'));

  const drawSnapshot = await getDocs(q);
  const now = new Date();

  const drawList = drawSnapshot.docs
    .map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            createdAt: data.createdAt?.toDate()
        } as Draw;
    })
    .filter(draw => draw.endDate <= now && !draw.status); // Filter for draws that have ended and have no status yet

  return drawList.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
}
