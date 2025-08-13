// This file would live on a server and use the Firebase Admin SDK
'use server';

import { dbAdmin, messaging } from '@/lib/firebase-admin';
import type { Draw, User } from '@/lib/types';
import { CollectionReference } from 'firebase-admin/firestore';

async function getAllUserTokens(): Promise<string[]> {
  if (!dbAdmin) {
    console.warn('Firestore Admin is not initialized. Skipping notification.');
    return [];
  }
  const usersRef = dbAdmin.collection('users') as CollectionReference<User>;
  const usersSnapshot = await usersRef.get();
  
  const tokens = usersSnapshot.docs.flatMap(doc => doc.data().fcmTokens || []);
  return [...new Set(tokens)]; // Return unique tokens
}

async function getTicketHolderTokens(drawId: string): Promise<string[]> {
    if (!dbAdmin) {
        console.warn('Firestore Admin is not initialized. Skipping notification.');
        return [];
    }

    const ticketsRef = dbAdmin.collection('tickets');
    const ticketsSnapshot = await ticketsRef.where('drawId', '==', drawId).get();

    if (ticketsSnapshot.empty) {
        return [];
    }
    
    const userIds = [...new Set(ticketsSnapshot.docs.map(doc => doc.data().userId))];

    const usersRef = dbAdmin.collection('users') as CollectionReference<User>;
    const usersSnapshot = await usersRef.where('__name__', 'in', userIds).get();

    const tokens = usersSnapshot.docs.flatMap(doc => doc.data().fcmTokens || []);
    return [...new Set(tokens)];
}


export async function sendNewDrawNotification(draw: Omit<Draw, 'startDate' | 'endDate' | 'announcementDate'> & { id: string }) {
  if (!messaging) {
    console.warn('Firebase Admin Messaging is not initialized. Skipping notification.');
    return;
  }
  
  const tokens = await getAllUserTokens();

  if (tokens.length === 0) {
    console.log('No user tokens found to send new draw notification.');
    return;
  }
  
  const message = {
    notification: {
      title: '🚀 A New Draw Has Arrived!',
      body: `Don't miss your chance to win ₹${draw.prize.toLocaleString('en-IN')} in the "${draw.name}" draw!`,
    },
    webpush: {
      fcmOptions: {
        link: `/draws/${draw.id}`
      },
      notification: {
          icon: draw.imageUrl || '/icon-192x192.png'
      }
    },
    tokens: tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`Successfully sent new draw notification to ${response.successCount} devices.`);
    if (response.failureCount > 0) {
        console.error(`Failed to send new draw notification to ${response.failureCount} devices.`);
    }
  } catch (error) {
    console.error('Error sending new draw notification:', error);
  }
}


export async function sendAnnouncementStartingNotification(draw: Draw) {
  if (!messaging) {
    console.warn('Firebase Admin Messaging is not initialized. Skipping notification.');
    return;
  }

  const tokens = await getTicketHolderTokens(draw.id);

   if (tokens.length === 0) {
    console.log('No ticket holder tokens found for this draw.');
    return;
  }

  const message = {
    notification: {
      title: `🎉 The results for "${draw.name}" are in!`,
      body: 'The winner announcement ceremony is starting now. Watch live!',
    },
     webpush: {
      fcmOptions: {
        link: `/announcements/${draw.id}`
      },
       notification: {
          icon: draw.imageUrl || '/icon-192x192.png'
      }
    },
    tokens: tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`Successfully sent announcement starting notification to ${response.successCount} devices.`);
     if (response.failureCount > 0) {
        console.error(`Failed to send announcement starting notification to ${response.failureCount} devices.`);
    }
  } catch (error) {
    console.error('Error sending announcement starting notification:', error);
  }
}
