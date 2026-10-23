"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { primaryButton } from "@/components/ui/styles";
import { TaskFormDialog, type TaskFormOptions } from "./task-form-dialog";

export function NewTaskButton({
  options,
  defaultProjectId,
  label = "Yeni İş Ata",
}: {
  options: TaskFormOptions;
  defaultProjectId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${primaryButton} h-9 px-4 text-sm`}
      >
        <Plus className="size-4.5" strokeWidth={2.6} />
        {label}
      </button>
      {open && (
        <TaskFormDialog
          open={open}
          onClose={() => setOpen(false)}
          options={options}
          defaultProjectId={defaultProjectId}
        />
      )}
    </>
  );
}
