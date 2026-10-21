"use client";

import { useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";
import { Modal } from "./modal";
import { dangerButton, ghostButton } from "./styles";

// "Emin misiniz?" penceresi; onConfirm hata döndürürse pencere açık kalır
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<{ error: string | null }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title={title} size="sm">
      <p className="text-[15px] text-slate-600">{message}</p>
      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2.5">
        <button type="button" onClick={close} className={ghostButton}>
          Vazgeç
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await onConfirm();
              if (result.error) setError(result.error);
              else close();
            })
          }
          className={dangerButton}
        >
          {pending ? "Bekleyin…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
