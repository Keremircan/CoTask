import type { TaskPriority, TaskStatus } from "@/types/database";

export const TASK_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "done",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Yapılacak",
  in_progress: "Devam ediyor",
  review: "İncelemede",
  done: "Tamamlandı",
};

export const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 ring-slate-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  review: "bg-sky-50 text-sky-700 ring-sky-200",
  done: "bg-teal-50 text-teal-700 ring-teal-200",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase("tr-TR") ?? "")
      .join("") || "?"
  );
}
