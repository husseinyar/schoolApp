// Firebase Messaging Service Worker
// This file MUST be at /public/firebase-messaging-sw.js so the browser can register it.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// NOTE: These values are intentionally hard-coded here because service workers
// cannot access Next.js environment variables at runtime.
firebase.initializeApp({
  apiKey: "AIzaSyBpUB4o66sjhS7x1OFQWtOz6bMHVndycfw",
  authDomain: "cv-craft-h1bob.firebaseapp.com",
  projectId: "cv-craft-h1bob",
  storageBucket: "cv-craft-h1bob.firebasestorage.app",
  messagingSenderId: "398208259764",
  appId: "1:398208259764:web:a52be8b7202b474e0e69e1",
});

const messaging = firebase.messaging();

// Handle background messages (when tab is not focused)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "Schoolbus Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/dashboard")
  );
});
