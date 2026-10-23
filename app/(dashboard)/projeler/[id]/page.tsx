import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { isUuid } from "@/lib/tasks";
import { getTaskFormOptions } from "@/lib/task-queries";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { TaskBoard } from "@/components/tasks/task-board";

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
  const userId = await getUserId(); // oturum kontrolü (yerel)
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: project }, { data: tasks }, formOptions] = await Promise.all([
    supabase.from("projects").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("tasks")
      .select(
        "id, title, status, priority, revision_count, created_at, assigned_to, created_by, creator:profiles!tasks_created_by_fkey(full_name), assignee:profiles!tasks_assigned_to_fkey(full_name)",
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
        <TaskBoard tasks={all} userId={userId} />
      </div>
    </>
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
