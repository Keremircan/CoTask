"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

// Mesaj listesini kaydırır: açılışta en alta iner; yeni mesaj geldiğinde
// kullanıcı zaten en alttaysa (eski mesajları okumuyorsa) aşağı kayar.
export function ChatScroller({
  children,
  messageCount,
}: {
  children: ReactNode;
  messageCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [messageCount]);

  // Gönderilen mesaj (iyimser balon) eklenince de aşağı kaydır
  useEffect(() => {
    const scrollDown = () => {
      const el = ref.current;
      if (el) el.scrollTop = el.scrollHeight;
    };
    window.addEventListener("cotask:chat-sent", scrollDown);
    return () => window.removeEventListener("cotask:chat-sent", scrollDown);
  }, []);

  return (
    <div
      ref={ref}
      onScroll={(e) => {
        const el = e.currentTarget;
        nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      }}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-4"
    >
      {children}
    </div>
  );
}
