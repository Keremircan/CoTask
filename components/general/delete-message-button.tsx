"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { deleteGeneralMessage } from "@/actions/general";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteMessageButton({ messageId }: { messageId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mesajı sil"
        title="Mesajı sil"
        className="rounded-md p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100"
      >
        <Trash className="size-3.5" />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Mesajı sil"
        message="Bu mesaj ve ekli dokümanları herkes için kalıcı olarak silinecek."
        confirmLabel="Mesajı sil"
        onConfirm={() => deleteGeneralMessage(messageId)}
      />
    </>
  );
}
