"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

// Tarayıcının yerel <dialog> elemanı: odak yönetimi ve Esc ile kapanma hazır gelir
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // React'in autoFocus'u <dialog> açılmadan çalışır; ilk form alanına biz odaklanalım
      dialog
        .querySelector<HTMLElement>(
          "input:not([type=hidden]):not([type=file]):not(:disabled), textarea:not(:disabled), select:not(:disabled)",
        )
        ?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl" }[size];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Pencere dışına (arka plana) tıklayınca kapan
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] leading-tight font-bold tracking-tight">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-[15px] text-slate-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="-m-1.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
