"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  CircleCheckBig,
  LayoutDashboard,
} from "lucide-react";

const LINKS = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/is-atama", label: "İş Atama", icon: CircleCheckBig },
  { href: "/is-takip", label: "İş Takip", icon: ChartNoAxesCombined },
];

export function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={
        compact
          ? "flex gap-1 overflow-x-auto"
          : "flex flex-col gap-1.5"
      }
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "flex shrink-0 items-center gap-3 rounded-xl font-medium transition",
              compact ? "px-3 py-2 text-[15px]" : "px-4 py-3.5 text-[17px]",
              active
                ? "bg-teal-400/15 text-teal-300"
                : "text-slate-200 hover:bg-white/5 hover:text-white",
            ].join(" ")}
          >
            <Icon className="size-5 shrink-0" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
