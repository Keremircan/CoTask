"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Hand, Pencil, Send, Trash } from "lucide-react";
import {
  acceptTask,
  completeTask,
  deleteTask,
  submitForReview,
} from "@/actions/tasks";
import { canAccept, canComplete, canSubmitForReview } from "@/lib/tasks";
import type { TaskStatus } from "@/types/database";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  smallDangerButton,
  smallGhostButton,
  smallPrimaryButton,
  smallSecondaryButton,
} from "@/components/ui/styles";
import {
  TaskFormDialog,
  type EditableTask,
  type TaskFormOptions,
} from "./task-form-dialog";

export type ActionTask = EditableTask & {
  status: TaskStatus;
  created_by: string | null;
};

// mode:
//  "assignee" → Görevlerim: Kabul Et / Kontrole Gönder
//  "owner"    → Atadığım Görevler: Düzenle / Tamamlandı / Sil
//  "detail"   → Görev detayı: kişiye göre geçerli olan tüm butonlar
export function TaskActions({
  task,
  userId,
  mode,
  formOptions,
  afterDeleteHref,
}: {
  task: ActionTask;
  userId: string;
  mode: "assignee" | "owner" | "detail";
  formOptions?: TaskFormOptions;
  afterDeleteHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = task.created_by === userId;
  const showAccept = mode !== "owner" && canAccept(task, userId);
  const showReview = mode !== "owner" && canSubmitForReview(task, userId);
  const showComplete = mode !== "assignee" && isOwner && task.status !== "done";
  const completeAllowed = canComplete(task, userId);
  const showOwnerTools = mode !== "assignee" && isOwner;

  function run(action: (id: string) => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action(task.id);
      if (result.error) setError(result.error);
    });
  }

  if (!showAccept && !showReview && !showComplete && !showOwnerTools) return null;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {showAccept && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(acceptTask)}
            className={smallPrimaryButton}
          >
            <Hand className="size-4" />
            {task.assigned_to === null ? "Üstlen ve kabul et" : "Kabul Et"}
          </button>
        )}
        {showReview && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(submitForReview)}
            className={smallPrimaryButton}
          >
            <Send className="size-4" /> Kontrole gönder
          </button>
        )}
        {showOwnerTools && formOptions && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(true)}
            className={smallGhostButton}
          >
            <Pencil className="size-4" /> Düzenle
          </button>
        )}
        {showComplete && (
          <button
            type="button"
            disabled={pending || !completeAllowed}
            onClick={() => run(completeTask)}
            title={
              completeAllowed
                ? undefined
                : "Görev, alan kişi kabul etmeden tamamlanamaz."
            }
            className={smallSecondaryButton}
          >
            <CheckCheck className="size-4" /> Tamamlandı
          </button>
        )}
        {showOwnerTools && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setDeleting(true)}
            className={smallDangerButton}
          >
            <Trash className="size-4" /> Sil
          </button>
        )}
      </div>

      {showComplete && !completeAllowed && task.status === "pending" && (
        <p className="text-xs text-slate-400">Kabul edilince tamamlanabilir.</p>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {formOptions && editing && (
        <TaskFormDialog
          open={editing}
          onClose={() => setEditing(false)}
          options={formOptions}
          task={task}
        />
      )}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Görevi sil"
        message={`"${task.title}" görevi; yorumları ve ekleriyle birlikte kalıcı olarak silinecek.`}
        confirmLabel="Görevi sil"
        onConfirm={async () => {
          const result = await deleteTask(task.id);
          if (!result.error && afterDeleteHref) router.push(afterDeleteHref);
          return result;
        }}
      />
    </div>
  );
}
