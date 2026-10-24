"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, CircleAlert, LogOut, X } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { initials } from "@/lib/tasks";
import { usePushNotifications } from "@/components/pwa/use-push-notifications";

const STATUS_NOTE: Record<string, string> = {
  denied:
    "Bildirim izni bu tarayıcıda engellenmiş. Adres çubuğundaki kilit simgesinden izni açıp sayfayı yenileyin.",
  "ios-install":
    "iPhone/iPad'de bildirim için CoTask'ı önce Safari'de Paylaş → Ana Ekrana Ekle ile kurun, sonra uygulamadan açın.",
  unsupported: "Bu tarayıcı anlık bildirimleri desteklemiyor.",
};

// Sağ üstteki baş harf avatarı: kullanıcı bilgisi, bildirimler ve güvenli çıkış
export function UserMenu({
  name,
  email,
  isAdmin,
}: {
  name: string;
  email: string;
  isAdmin: boolean;
}) {
  const [, startTransition] = useTransition();
  const push = usePushNotifications();
  const [note, setNote] = useState<string | null>(null);

  const pushItem: MenuItem | null =
    push.status === "loading"
      ? null
      : push.status === "on"
        ? {
            label: "Bildirimleri kapat",
            icon: <BellOff className="size-4" />,
            onSelect: () => void push.disable(),
          }
        : {
            label: push.busy ? "Bildirimler açılıyor…" : "Bildirimleri aç",
            icon: <Bell className="size-4" />,
            onSelect: () => {
              if (push.status === "off") return void push.enable();
              setNote(STATUS_NOTE[push.status] ?? null);
            },
          };

  const message = push.error ?? note;

  return (
    <>
      <Menu
        label="Hesap menüsü"
        tone="dark"
        trigger={initials(name)}
        triggerClassName="flex size-8 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-neutral-100 transition hover:bg-white/[0.14]"
        header={
          <div className="mb-1 border-b border-white/10 px-3 pt-2 pb-2.5">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-neutral-400">{email}</p>
            {isAdmin && (
              <span className="mt-1.5 inline-block rounded-md bg-teal-400/15 px-1.5 py-0.5 text-[11px] font-bold text-teal-300">
                Admin
              </span>
            )}
          </div>
        }
        items={[
          ...(pushItem ? [pushItem] : []),
          {
            label: "Güvenli çıkış",
            icon: <LogOut className="size-4" />,
            danger: true,
            // Çıkışta bu cihazın bildirim aboneliği de kaldırılır: hesap kapalıyken bildirim gelmesin
            onSelect: () =>
              startTransition(async () => {
                if (push.status === "on") await push.disable().catch(() => {});
                await logout();
              }),
          },
        ]}
      />
      {message && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-lg lg:right-6 lg:bottom-6 lg:left-auto lg:mx-0"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={() => {
              setNote(null);
              push.clearError();
            }}
            aria-label="Uyarıyı kapat"
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
