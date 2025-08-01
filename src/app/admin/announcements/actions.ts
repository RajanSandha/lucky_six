'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Draw } from '@/lib/types';

export async function getDrawsAwaitingWinner(): Promise<Draw[]> {
  const drawsCol = collection(db, 'draws');
  
  // Firestore does not allow range (<, <=, >, >=) and inequality (!=) filters on different fields in the same query without a composite index.
  // To work around this, we fetch all draws that have ended and then filter them in code.
  // This is acceptable for a reasonable number of draws.
  const q = query(
    drawsCol,
    where('endDate', '<=', Timestamp.now())
  );

  const drawSnapshot = await getDocs(q);

  const drawList = drawSnapshot.docs
    .map(doc => {
        const data = doc.data();
        return {
        id: doc.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt?.toDate(),
        } as Draw;
    })
    .filter(draw => draw.status !== 'finished'); // Filter for draws that are not yet finished.

  return drawList.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
}
