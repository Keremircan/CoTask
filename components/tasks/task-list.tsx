import Link from "next/link";
import { CalendarClock, FolderKanban, MessageSquare, UserRound } from "lucide-react";
import type { TaskStatus } from "@/types/database";
import { formatDateTime } from "@/lib/format";
import { previewText } from "@/lib/tasks";
import { StatusBadge } from "./status-badge";
import { TaskActions } from "./task-actions";
import type { TaskFormOptions } from "./task-form-dialog";

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  assigned_to: string | null;
  created_by: string | null;
  project_id: string | null;
  project: { id: string; name: string } | null;
  assignee: { full_name: string | null } | null;
  creator: { full_name: string | null } | null;
  comments: { count: number }[];
};

// Atadığım Görevler ve Görevlerim sayfalarının ortak satır listesi
export function TaskList({
  tasks,
  userId,
  mode,
  formOptions,
  empty,
}: {
  tasks: TaskListItem[];
  userId: string;
  mode: "assignee" | "owner";
  formOptions?: TaskFormOptions;
  empty: string;
}) {
  if (!tasks.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center text-[15px] text-slate-500">
        {empty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => {
        const person =
          mode === "owner"
            ? task.assigned_to === null
              ? "Herkes"
              : (task.assignee?.full_name ?? "Eski üye")
            : (task.creator?.full_name ?? "Eski üye");
        return (
          <li
            key={task.id}
            className="flex flex-col gap-3 py-4.5 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/gorevler/${task.id}`}
                  className="text-[17px] font-bold text-slate-900 transition hover:text-teal-700 hover:underline"
                >
                  {task.title}
                </Link>
                <StatusBadge status={task.status} />
              </div>
              {task.description && (
                <p className="mt-1 line-clamp-1 text-[15px] text-slate-500">
                  {previewText(task.description)}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {task.project && (
                  <Link
                    href={`/projeler/${task.project.id}`}
                    className="inline-flex items-center gap-1.5 hover:text-teal-700"
                  >
                    <FolderKanban className="size-4" />
                    {task.project.name}
                  </Link>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-4" />
                  {mode === "owner" ? "Sorumlu: " : "Atayan: "}
                  {person}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-4" />
                  {formatDateTime(task.created_at)}
                </span>
                <Link
                  href={`/gorevler/${task.id}#yorumlar`}
                  className="inline-flex items-center gap-1.5 hover:text-teal-700"
                >
                  <MessageSquare className="size-4" />
                  {task.comments[0]?.count ?? 0} yorum
                </Link>
              </div>
            </div>
            <TaskActions
              task={task}
              userId={userId}
              mode={mode}
              formOptions={formOptions}
            />
          </li>
        );
      })}
    </ul>
  );
}
