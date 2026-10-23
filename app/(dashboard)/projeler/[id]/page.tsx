import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { BOARD_COLUMNS, isUuid, STATUS_DOTS } from "@/lib/tasks";
import { getTaskFormOptions } from "@/lib/task-queries";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { PriorityBadge } from "@/components/tasks/priority";

export const metadata: Metadata = { title: "Proje · CoTask" };

export default function ProjectBoardPage({ params }: PageProps<"/projeler/[id]">) {
  return (
    // params istek anında okunur; Suspense içinde kalmalı
    <Suspense fallback={<BoardSkeleton />}>
      <Board params={params} />
    </Suspense>
  );
}

async function Board({ params }: Pick<PageProps<"/projeler/[id]">, "params">) {
  await getUserId(); // oturum kontrolü (yerel)
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: project }, { data: tasks }, formOptions] = await Promise.all([
    supabase.from("projects").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("tasks")
      .select(
        "id, title, status, priority, created_at, assigned_to, creator:profiles!tasks_created_by_fkey(full_name), assignee:profiles!tasks_assigned_to_fkey(full_name)",
      )
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    getTaskFormOptions(),
  ]);

  if (!project) notFound();
  const all = tasks ?? [];

  return (
    <>
      {/* Mobilde proje adı üst çubukta; burada görev sayısı ve buton kalır */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4 lg:mb-5 lg:items-end">
        <p className="text-xs font-medium text-slate-500 lg:hidden">{all.length} görev</p>
        <div className="hidden min-w-0 lg:block">
          <p className="text-xs font-medium tracking-[0.12em] text-slate-500">PROJE</p>
          <h1 className="mt-1 truncate text-2xl leading-tight font-bold tracking-tight text-slate-900">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {all.length} görev · tüm ekip bu panoyu görür
          </p>
        </div>
        <NewTaskButton
          options={formOptions}
          defaultProjectId={project.id}
          label="Yeni görev"
        />
      </header>

      {/* Mobilde sütunlar yana kaydırılır (çubuk gizli); sütunlar sayfanın altına kadar uzanır */}
      <div className="no-scrollbar -mx-4 flex flex-1 flex-col overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="grid min-h-[60vh] min-w-[920px] flex-1 grid-cols-4 gap-3 xl:min-w-0">
          {BOARD_COLUMNS.map((column) => {
            const items = all.filter((t) => t.status === column.status);
            return (
              <section
                key={column.status}
                aria-label={column.title}
                className="flex flex-col rounded-xl bg-slate-200/50 p-2.5"
              >
                <div className="mb-2.5 flex items-center justify-between px-1.5 pt-1">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className={`size-2 rounded-full ${STATUS_DOTS[column.status]}`} />
                    {column.title}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
                    {items.length}
                  </span>
                </div>

                <ul className="flex flex-col gap-2">
                  {items.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/gorevler/${task.id}`}
                        className="block rounded-lg border border-slate-200/60 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-teal-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13.5px] leading-snug font-semibold text-slate-900 [overflow-wrap:anywhere]">
                            {task.title}
                          </p>
                          <PriorityBadge priority={task.priority} size="xs" />
                        </div>
                        <FromTo
                          from={task.creator?.full_name ?? "Eski üye"}
                          to={
                            task.assigned_to === null
                              ? "Herkes"
                              : (task.assignee?.full_name ?? "Eski üye")
                          }
                        />
                        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                          <CalendarClock className="size-3.5" />
                          {formatDateTime(task.created_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="rounded-lg border border-dashed border-slate-300/70 px-3 py-5 text-center text-sm text-slate-400">
                      Görev yok
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Dar kartlarda sadece ilk ad; tam ad üzerine gelince görünür
function FromTo({ from, to }: { from: string; to: string }) {
  const first = (name: string) => name.split(/\s+/)[0] || name;
  return (
    <p
      title={`${from} → ${to}`}
      className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-slate-600"
    >
      <span className="truncate">{first(from)}</span>
      <ArrowRight className="size-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{first(to)}</span>
    </p>
  );
}

function BoardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 hidden h-20 w-72 rounded-xl bg-slate-200/70 lg:block" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[60vh] rounded-xl bg-slate-200/50" />
        ))}
      </div>
    </div>
  );
}
