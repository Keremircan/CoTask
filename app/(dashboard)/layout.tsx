import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { SidebarShell } from "./_components/sidebar-shell";
import { SidebarNav, SidebarNavList } from "./_components/sidebar-nav";
import { UserMenu } from "./_components/user-menu";
import { MobileTabBar, MobileTabBarList } from "./_components/mobile-tab-bar";
import { Logo } from "@/components/ui/logo";
import { SidebarFooter, SidebarFooterSkeleton } from "./_components/sidebar-footer";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-1 bg-[#f2f5f8]">
      <SidebarShell>
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-6">
          <span className="flex min-w-0 items-center gap-2.5">
            <Logo size={30} className="rounded-[8px]" />
            <span className="truncate text-[19px] font-semibold tracking-tight text-white">
              CoTask
            </span>
          </span>
          <Suspense fallback={<div className="size-10 rounded-full bg-white/[0.08]" />}>
            <SidebarUser />
          </Suspense>
        </div>
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarData />
        </Suspense>
        <Suspense fallback={<SidebarFooterSkeleton />}>
          <SidebarFooter />
        </Suspense>
      </SidebarShell>

      {/* Mobilde üstte sabit çubuk, altta sekme çubuğu var: içerik ikisinin arasında kalır */}
      <main className="flex min-w-0 flex-1 flex-col px-4 pt-[calc(5rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-9 lg:pt-8 lg:pb-7">
        <div className="flex-1">{children}</div>
        <footer className="mt-12 hidden text-sm text-slate-400 lg:block">
          © 2026 CoTask · Ekip içi iş takip
        </footer>
      </main>

      <Suspense fallback={<MobileTabBarList pathname={null} />}>
        <MobileTabBar />
      </Suspense>
    </div>
  );
}

async function SidebarUser() {
  const user = await getCurrentUser();
  return <UserMenu name={user.name} email={user.email} isAdmin={user.isAdmin} />;
}

async function SidebarData() {
  const [user, projects] = await Promise.all([getCurrentUser(), getProjects()]);
  const props = { projects, userId: user.id, isAdmin: user.isAdmin };
  return (
    // Aktif sayfa (usePathname) istek anında bilinir; o gelene kadar vurgusuz liste
    <Suspense fallback={<SidebarNavList {...props} pathname={null} />}>
      <SidebarNav {...props} />
    </Suspense>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex-1 animate-pulse space-y-2 px-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-11 rounded-lg bg-white/[0.04]" />
      ))}
      <div className="mt-7 h-6 w-24 rounded bg-white/[0.04]" />
    </div>
  );
}
