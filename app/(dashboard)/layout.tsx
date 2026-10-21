import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { NavLinks } from "./_components/nav-links";
import {
  LogoutButton,
  UserCard,
  UserCardSkeleton,
} from "./_components/user-card";

function Brand() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#4cc3a9] to-[#2a8577] shadow-[0_8px_28px_-4px_rgba(45,212,191,0.45)]">
        <ClipboardList className="size-6 text-white" strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <p className="text-[19px] font-bold text-white">CoTask</p>
        <p className="text-sm text-slate-300">Çalışma Alanı</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-1 bg-[#f2f5f8]">
      {/* Masaüstü: sabit sol menü */}
      <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col bg-[#0b1324] px-4 pt-7 pb-5 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <p className="mt-11 mb-3 px-3 text-[13px] font-medium tracking-[0.14em] text-slate-400">
          MENÜ
        </p>
        <NavLinks />
        <div className="mt-auto">
          <Suspense fallback={<UserCardSkeleton />}>
            <UserCard />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil: üst menü */}
        <div className="bg-[#0b1324] px-4 pt-4 pb-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Brand />
            <LogoutButton compact />
          </div>
          <div className="mt-4">
            <NavLinks compact />
          </div>
        </div>

        <main className="flex flex-1 flex-col px-5 py-7 sm:px-9 lg:py-8">
          <div className="flex-1">{children}</div>
          <footer className="mt-12 text-sm text-slate-400">
            © 2026 CoTask · Ekip içi iş takip
          </footer>
        </main>
      </div>
    </div>
  );
}
