"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getFirebaseMessaging } from "@/lib/firebase/firebase-client";
import { getToken, onMessage } from "firebase/messaging";

export function NotificationProvider() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    async function registerToken() {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set.");
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.info("[FCM] Notification permission denied.");
          return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        if (!token) {
          console.warn("[FCM] No registration token received.");
          return;
        }

        // Save token to DB
        await fetch("/api/notifications/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            device: navigator.userAgent.slice(0, 100),
          }),
        });

        console.info("[FCM] Token registered successfully.");

        // Handle foreground messages
        onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? "Notification";
          const body = payload.notification?.body ?? "";
          // Show a browser toast for foreground messages
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" });
          }
        });
      } catch (err) {
        console.error("[FCM] Error registering token:", err);
      }
    }

    registerToken();
  }, [status, session]);

  return null; // headless component
}
