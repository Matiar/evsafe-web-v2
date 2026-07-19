"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp, isFirebaseConfigured } from "@/lib/firebase/config";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import {
  handleNotificationNavigation,
  type PushPayload,
} from "@/lib/firebase/messaging";

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [banner, setBanner] = useState<{
    title: string;
    body: string;
    data: PushPayload;
  } | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    async function initPush() {
      try {
        const { isSupported } = await import("firebase/messaging");
        if (!(await isSupported())) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;

        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

        const messaging = getMessaging(firebaseApp);
        await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      } catch (err) {
        console.warn("Push notification init skipped:", err);
      }
    }

    initPush();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    let unsubscribe: (() => void) | undefined;

    async function listenForeground() {
      try {
        const { isSupported } = await import("firebase/messaging");
        if (!(await isSupported())) return;

        const messaging = getMessaging(firebaseApp);
        unsubscribe = onMessage(messaging, (payload) => {
          const data = (payload.data ?? {}) as PushPayload;
          setBanner({
            title: payload.notification?.title ?? data.title ?? "New update",
            body: payload.notification?.body ?? data.body ?? "Tap to view",
            data,
          });
        });
      } catch {
        // messaging unavailable
      }
    }

    listenForeground();
    return () => unsubscribe?.();
  }, []);

  return (
    <>
      {children}
      {banner && (
        <NotificationBanner
          title={banner.title}
          body={banner.body}
          onTap={() => {
            handleNotificationNavigation(banner.data, router);
            setBanner(null);
          }}
          onDismiss={() => setBanner(null)}
        />
      )}
    </>
  );
}
