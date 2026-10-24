"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deletePushSubscription,
  savePushSubscription,
  sendTestPush,
} from "@/actions/push-notifications";

// Bu cihazdaki bildirim durumu
export type PushStatus =
  | "loading"
  | "unsupported" // tarayıcı desteklemiyor
  | "ios-install" // iPhone/iPad: önce "Ana Ekrana Ekle" ile uygulama olarak kurulmalı
  | "denied" // kullanıcı izni engelledi (tarayıcı ayarından açılır)
  | "off"
  | "on";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function base64UrlToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function toInput(sub: PushSubscription) {
  const json = sub.toJSON();
  return { endpoint: json.endpoint ?? "", keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } };
}

function detect(): PushStatus | null {
  if (typeof window === "undefined") return "loading";
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIos && !standalone ? "ios-install" : "unsupported";
  if (!VAPID_PUBLIC_KEY) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return null; // destekleniyor; abonelik durumuna bakılacak
}

async function getRegistration() {
  // Service worker canlıda sayfa açılışında kaydedilir; değilse (ör. geliştirme) burada kaydet
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (!existing) await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  return navigator.serviceWorker.ready;
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const early = detect();
      if (early) return setStatus(early);
      const registration = await navigator.serviceWorker.getRegistration("/");
      const sub = await registration?.pushManager.getSubscription();
      if (cancelled) return;
      if (sub && Notification.permission === "granted") {
        setStatus("on");
        // Aboneliği oturumdaki kullanıcıyla eşle (cihaz başka hesapla kullanılmış olabilir)
        savePushSubscription(toInput(sub)).catch(() => {});
      } else {
        setStatus("off");
      }
    })().catch(() => !cancelled && setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await getRegistration();
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY),
        }));
      const result = await savePushSubscription(toInput(sub));
      if (result.error) {
        await sub.unsubscribe().catch(() => {});
        setError(result.error);
        setStatus("off");
        return;
      }
      setStatus("on");
      await sendTestPush();
    } catch {
      setError("Bildirimler açılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setError("Bildirimler kapatılamadı.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, error, enable, disable, clearError: () => setError(null) };
}
