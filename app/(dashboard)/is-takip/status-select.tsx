"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import type { TaskStatus } from "@/types/database";
import { STATUS_LABELS, STATUS_STYLES, TASK_STATUSES } from "@/lib/tasks";
import { updateTaskStatus } from "../actions";

export function StatusSelect({
  taskId,
  status,
  title,
}: {
  taskId: string;
  status: TaskStatus;
  title: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: TaskStatus) {
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const result = await updateTaskStatus(taskId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="relative">
        <select
          aria-label={`"${title}" durumu`}
          value={optimistic}
          disabled={pending}
          onChange={(e) => onChange(e.target.value as TaskStatus)}
          className={`h-9 cursor-pointer appearance-none rounded-full py-0 pr-9 pl-3.5 text-sm font-bold ring-1 outline-none transition ring-inset focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60 ${STATUS_STYLES[optimistic]}`}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-70"
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
