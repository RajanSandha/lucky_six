'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Draw } from '@/lib/types';

export async function getDrawsAwaitingWinner(): Promise<Draw[]> {
  const drawsCol = collection(db, 'draws');
  // Query for draws that have ended and do not have a 'finished' status.
  const q = query(
    drawsCol,
    where('endDate', '<=', Timestamp.now()),
    where('status', '!=', 'finished')
  );

  const drawSnapshot = await getDocs(q);

  const drawList = drawSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as Draw;
  });

  return drawList.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
}
