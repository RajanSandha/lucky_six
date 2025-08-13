// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
const firebaseConfig = {
  apiKey: "AIzaSyDbpkZD0d47C6Fut4UKP2aHuFGA5cxN5Vo",
  authDomain: "lucky-six-bxkzw.firebaseapp.com",
  projectId: "lucky-six-bxkzw",
  storageBucket: "lucky-six-bxkzw.appspot.com",
  messagingSenderId: "902776449872",
  appId: "1:902776449872:web:76f0896539572d2cf8da55",
  measurementId: ""
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/icon-192x192.png", // Default icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
