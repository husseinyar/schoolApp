// Firebase Messaging Service Worker
// This file MUST be at /public/firebase-messaging-sw.js so the browser can register it.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// NOTE: These values are intentionally hard-coded here because service workers
// cannot access Next.js environment variables at runtime.
firebase.initializeApp({
  apiKey: "AIzaSyBb9Mn1PpWrUihdqZ8CXQCyYYk3HYULrtg",
  authDomain: "fritidshub.firebaseapp.com",
  projectId: "fritidshub",
  storageBucket: "fritidshub.firebasestorage.app",
  messagingSenderId: "456984656306",
  appId: "1:456984656306:web:5c6330d70c41b770034cab"
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
