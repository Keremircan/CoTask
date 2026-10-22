"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  CircleCheck,
  ClipboardList,
  House,
  MessagesSquare,
  PanelsTopLeft,
  Plus,
  Users,
} from "lucide-react";
import type { ProjectSummary } from "@/lib/projects";
import { NewProjectDialog } from "./new-project-dialog";
import { ProjectMenu } from "./project-menu";

const MAIN_LINKS = [
  { href: "/", label: "Ana sayfa", icon: House },
  { href: "/genel", label: "Genel", icon: MessagesSquare },
  { href: "/atadigim-gorevler", label: "Atadığım Görevler", icon: ClipboardList },
  { href: "/gorevlerim", label: "Görevlerim", icon: CircleCheck },
  { href: "/uyeler", label: "Üyeler", icon: Users },
];

const itemBase =
  "group flex h-11 items-center gap-3 rounded-lg px-3 text-[15.5px] transition";
const itemIdle = "text-neutral-300 hover:bg-white/[0.06] hover:text-white";
const itemActive = "bg-white/[0.08] font-semibold text-white";

type Props = {
  projects: ProjectSummary[];
  userId: string;
  isAdmin: boolean;
};

export function SidebarNav(props: Props) {
  return <SidebarNavList {...props} pathname={usePathname()} />;
}

// Aktif sayfa bilinmeden de (Suspense yedeği olarak) çizilebilir
export function SidebarNavList({
  projects,
  userId,
  isAdmin,
  pathname,
}: Props & { pathname: string | null }) {
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [creating, setCreating] = useState(false);

  const isActive = (href: string) =>
    pathname !== null &&
    (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <nav className="flex flex-col gap-0.5 px-3">
        {MAIN_LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${itemBase} ${active ? itemActive : itemIdle}`}
            >
              <Icon
                className={`size-[19px] shrink-0 ${active ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}
                strokeWidth={1.8}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between pr-1 pl-1">
          <button
            type="button"
            onClick={() => setProjectsOpen((v) => !v)}
            aria-expanded={projectsOpen}
            className="flex items-center gap-1.5 rounded-md py-1 text-[15px] font-medium text-neutral-200 hover:text-white"
          >
            Projeler
            <ChevronDown
              className={`size-4 text-neutral-500 transition-transform ${projectsOpen ? "" : "-rotate-90"}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            aria-label="Yeni proje oluştur"
            className="rounded-md p-1 text-neutral-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Plus className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        {projectsOpen && (
          <ul className="mt-2 -mr-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto pr-1">
            {projects.length === 0 && (
              <li className="px-3 py-2 text-sm text-neutral-500">
                Henüz proje yok. + ile oluşturun.
              </li>
            )}
            {projects.map((project) => {
              const href = `/projeler/${project.id}`;
              const active = isActive(href);
              const canManage = isAdmin || project.created_by === userId;
              return (
                <li key={project.id} className="relative">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`${itemBase} pr-11 ${active ? itemActive : itemIdle}`}
                  >
                    <PanelsTopLeft
                      className={`size-[19px] shrink-0 ${active ? "text-white" : "text-neutral-400"}`}
                      strokeWidth={1.8}
                    />
                    <span className="truncate">{project.name}</span>
                  </Link>
                  {canManage && (
                    <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
                      <ProjectMenu
                        project={project}
                        isCurrent={active}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <NewProjectDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
