"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

// Masaüstünde sabit sol menü; mobilde soldan açılan çekmece
export function SidebarShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobil üst çubuk */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-[#141414] px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menüyü aç"
          className="-ml-1.5 rounded-lg p-1.5 text-neutral-300 hover:bg-white/8"
        >
          <Menu className="size-6" />
        </button>
        <span className="text-[17px] font-semibold text-white">CoTask</span>
      </div>

      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        // Menüdeki bir linke tıklanınca mobil çekmece kapanır
        onClickCapture={(e) => {
          if ((e.target as Element).closest("a")) setOpen(false);
        }}
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-r border-white/5 bg-[#141414] transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {open && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Menüyü kapat"
            className="absolute top-4 -right-12 rounded-lg p-1.5 text-white lg:hidden"
          >
            <X className="size-6" />
          </button>
        )}
        {children}
      </aside>
    </>
  );
}
