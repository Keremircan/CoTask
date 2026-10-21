import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FolderKanban, Hand } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, PRIORITY_LABELS } from "@/lib/tasks";
import { formatDateTime } from "@/lib/format";
import { ATTACHMENTS_BUCKET } from "@/lib/attachments";
import { extractLinks } from "@/lib/links";
import { getTaskFormOptions } from "@/lib/task-queries";
import { Markdown } from "@/components/markdown/markdown";
import { Avatar } from "@/components/ui/avatar";
import { card } from "@/components/ui/styles";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskActions } from "@/components/tasks/task-actions";
import { TaskComments } from "@/components/tasks/task-comments";
import {
  TaskAttachments,
  type TaskAttachment,
} from "@/components/tasks/task-attachments";
import { TaskLinks } from "@/components/tasks/task-links";

export const metadata: Metadata = { title: "Görev detayı · CoTask" };

// İmzalı dosya linklerinin geçerlilik süresi
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default function TaskDetailPage({ params }: PageProps<"/gorevler/[id]">) {
  return (
    // params istek anında okunur; Suspense içinde kalmalı
    <Suspense fallback={<DetailSkeleton />}>
      <TaskDetail params={params} />
    </Suspense>
  );
}

async function TaskDetail({ params }: Pick<PageProps<"/gorevler/[id]">, "params">) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();

  const [taskRes, commentsRes, attachmentsRes, formOptions] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        `id, title, description, status, priority, project_id, assigned_to, created_by,
         accepted_at, created_at,
         project:projects!tasks_project_id_fkey(id, name),
         assignee:profiles!tasks_assigned_to_fkey(full_name),
         creator:profiles!tasks_created_by_fkey(full_name)`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("task_comments")
      .select(
        "id, content, created_at, author:profiles!task_comments_user_id_fkey(full_name)",
      )
      .eq("task_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("task_attachments")
      .select(
        "id, file_url, file_name, file_type, created_at, uploader:profiles!task_attachments_uploaded_by_fkey(full_name)",
      )
      .eq("task_id", id)
      .order("created_at", { ascending: false }),
    getTaskFormOptions(),
  ]);

  const task = taskRes.data;
  if (!task) notFound();

  const comments = commentsRes.data ?? [];
  const rawAttachments = attachmentsRes.data ?? [];

  // Özel bucket: her ek için süreli imzalı link üret
  const signed = new Map<string, string>();
  if (rawAttachments.length) {
    const { data } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrls(
        rawAttachments.map((a) => a.file_url),
        SIGNED_URL_TTL_SECONDS,
      );
    data?.forEach((item) => {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    });
  }
  const attachments: TaskAttachment[] = rawAttachments.map((a) => ({
    id: a.id,
    file_name: a.file_name,
    file_type: a.file_type,
    created_at: a.created_at,
    uploader: a.uploader,
    signedUrl: signed.get(a.file_url) ?? null,
  }));

  const links = extractLinks([
    { text: task.description, source: "Açıklama" },
    ...comments.map((c) => ({
      text: c.content,
      source: `Yorum · ${c.author?.full_name ?? "Eski üye"}`,
    })),
  ]);

  const creatorName = task.creator?.full_name ?? "Eski üye";
  const isOpen = task.assigned_to === null;
  const assigneeName = isOpen ? "Herkes" : (task.assignee?.full_name ?? "Eski üye");
  const backHref = task.project ? `/projeler/${task.project.id}` : "/";

  return (
    <>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-slate-500 transition hover:text-teal-700"
      >
        <ArrowLeft className="size-4" />
        {task.project ? `${task.project.name} panosuna dön` : "Ana sayfaya dön"}
      </Link>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {/* Üst bilgi kartı */}
          <section className={`${card} p-6 sm:p-7`}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              {task.priority !== "medium" && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {PRIORITY_LABELS[task.priority]} öncelik
                </span>
              )}
            </div>
            <h1 className="mt-3 text-[28px] leading-tight font-bold tracking-tight text-slate-900 [overflow-wrap:anywhere]">
              {task.title}
            </h1>

            {isOpen && task.status === "pending" && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                <Hand className="size-4 shrink-0" />
                Bu görev herkese atandı; ilk kabul eden kişi görevi üstlenir.
              </p>
            )}

            <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 2xl:grid-cols-4">
              <Meta label="Atayan">
                <Person name={creatorName} />
              </Meta>
              <Meta label="Sorumlu">
                <Person name={assigneeName} />
              </Meta>
              <Meta label="Proje">
                {task.project ? (
                  <Link
                    href={`/projeler/${task.project.id}`}
                    className="flex items-center gap-2 hover:text-teal-700"
                  >
                    <FolderKanban className="size-4 text-slate-400" />
                    <span className="truncate">{task.project.name}</span>
                  </Link>
                ) : (
                  <span className="text-slate-400">Projesiz</span>
                )}
              </Meta>
              <Meta label="Oluşturulma">
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-slate-400" />
                  {formatDateTime(task.created_at)}
                </span>
              </Meta>
            </dl>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <TaskActions
                task={task}
                userId={user.id}
                mode="detail"
                formOptions={formOptions}
                afterDeleteHref={backHref}
              />
              {task.accepted_at && (
                <p className="mt-3 text-sm text-slate-400">
                  {formatDateTime(task.accepted_at)} tarihinde kabul edildi.
                </p>
              )}
            </div>
          </section>

          {/* Açıklama */}
          <section className={`${card} p-6 sm:p-7`}>
            <h2 className="mb-3 text-[20px] font-bold text-slate-900">Açıklama</h2>
            {task.description ? (
              <Markdown>{task.description}</Markdown>
            ) : (
              <p className="text-slate-400">Bu görev için açıklama eklenmemiş.</p>
            )}
          </section>

          <div id="yorumlar" className="scroll-mt-20">
            <TaskComments
              taskId={task.id}
              comments={comments}
              currentUserName={user.name}
            />
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8">
          <TaskAttachments taskId={task.id} attachments={attachments} />
          <TaskLinks links={links} />
        </aside>
      </div>
    </>
  );
}

function Person({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar name={name} size="sm" />
      <span className="truncate">{name}</span>
    </span>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-slate-400 uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-[15px] font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid animate-pulse items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className={`${card} h-60`} />
        <div className={`${card} h-40`} />
        <div className={`${card} h-64`} />
      </div>
      <div className="space-y-6">
        <div className={`${card} h-56`} />
        <div className={`${card} h-40`} />
      </div>
    </div>
  );
}
