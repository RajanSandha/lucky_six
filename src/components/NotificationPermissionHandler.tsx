'use client';

import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BellRing } from 'lucide-react';

const NotificationPermissionHandler = () => {
  const { user, updateUserFCMToken } = useAuth();
  const { toast } = useToast();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  useEffect(() => {
    // Listen for foreground messages
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });
      return () => unsubscribe();
    }
  }, [toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check if permission was already denied
      if (Notification.permission === 'denied') {
        console.log('Notification permission has been denied.');
        return;
      }
      
      // Check if permission is not yet granted or denied
      if (Notification.permission === 'default') {
        // Show a dialog to explain why we need permission before asking
        const permissionAsked = localStorage.getItem('notificationPermissionAsked');
        if (!permissionAsked) {
           setShowPermissionDialog(true);
        }
      } else if (Notification.permission === 'granted') {
         // If permission is already granted, ensure we have the token
         requestToken();
      }
    }
  }, [user]);

  const requestToken = async () => {
    if (!messaging || !process.env.NEXT_PUBLIC_VAPID_KEY) {
      console.error('Firebase Messaging is not initialized or VAPID key is missing.');
      return;
    }
    try {
      const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        if (user) {
          await updateUserFCMToken(currentToken);
        }
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  };

  const handleAllowNotifications = async () => {
     localStorage.setItem('notificationPermissionAsked', 'true');
     setShowPermissionDialog(false);
     const permission = await Notification.requestPermission();
     if (permission === 'granted') {
        console.log('Notification permission granted.');
        await requestToken();
     } else {
        console.log('Notification permission denied.');
     }
  };

  const handleCancel = () => {
     localStorage.setItem('notificationPermissionAsked', 'true');
     setShowPermissionDialog(false);
  }

  return (
    <AlertDialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
           <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
              <BellRing className="h-10 w-10 text-primary" />
           </div>
          <AlertDialogTitle className="text-center font-headline">Stay in the Loop!</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Allow notifications to get instant alerts for new prize draws, winner announcements, and other important updates. Never miss a chance to win!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel onClick={handleCancel}>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleAllowNotifications}>Allow Notifications</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NotificationPermissionHandler;
