import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { initials } from "@/lib/tasks";
import { logout } from "@/app/login/actions";

export async function UserCard() {
  const user = await getCurrentUser();

  return (
    <div className="rounded-2xl bg-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-900/70 text-sm font-bold text-teal-100">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{user.name}</p>
          <p className="truncate text-sm text-slate-400">Geliştirici / Ortak</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logout} className={compact ? "" : "mt-4 pl-14"}>
      <button
        type="submit"
        className="inline-flex items-center gap-2.5 rounded-lg text-[16px] text-rose-200 transition hover:text-rose-100"
      >
        <LogOut className="size-5" />
        {compact ? <span className="sr-only">Güvenli çıkış</span> : "Güvenli çıkış"}
      </button>
    </form>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-full bg-white/10" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-3 w-32 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-4 ml-14 h-4 w-28 rounded bg-white/10" />
    </div>
  );
}
