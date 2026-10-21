"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Menu } from "@/components/ui/menu";
import { initials } from "@/lib/tasks";

// Sağ üstteki baş harf avatarı: kullanıcı bilgisi ve güvenli çıkış
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

  return (
    <Menu
      label="Hesap menüsü"
      tone="dark"
      trigger={initials(name)}
      triggerClassName="flex size-10 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-neutral-100 transition hover:bg-white/[0.14]"
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
        {
          label: "Güvenli çıkış",
          icon: <LogOut className="size-4" />,
          danger: true,
          onSelect: () => startTransition(() => logout()),
        },
      ]}
    />
  );
}
