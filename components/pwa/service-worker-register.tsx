"use client";

import { useEffect } from "react";

// Service worker'ı kaydeder (sadece canlı/production ortamında;
// geliştirme sırasında önbellek karışıklığı yaratmasın diye).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Kayıt başarısız olursa uygulama yine normal çalışır
      });
  }, []);

  return null;
}
