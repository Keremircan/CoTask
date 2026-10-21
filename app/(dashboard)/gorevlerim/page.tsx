import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { TASK_LIST_SELECT } from "@/lib/task-queries";
import { card } from "@/components/ui/styles";
import { TaskList } from "@/components/tasks/task-list";
import { PageHeader } from "../_components/page-header";
import { ListSkeleton, SectionTitle } from "../_components/list-parts";

export const metadata: Metadata = { title: "Görevlerim · CoTask" };

export default function MyTasksPage() {
  return (
    <Suspense fallback={<ListSkeleton title="Görevlerim" />}>
      <MyTasks />
    </Suspense>
  );
}

async function MyTasks() {
  const userId = await getUserId(); // yerel, Supabase isteği yok
  const supabase = await createClient();

  // Bana atananlar + "Herkes"e atanmış ve henüz kimsenin almadığı görevler
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(TASK_LIST_SELECT)
    .or(`assigned_to.eq.${userId},and(assigned_to.is.null,status.eq.pending)`)
    .order("created_at", { ascending: false });

  const all = tasks ?? [];
  const waiting = all.filter((t) => t.status === "pending");
  const working = all.filter((t) => t.status === "in_progress" || t.status === "review");
  const done = all.filter((t) => t.status === "done");

  return (
    <>
      <PageHeader
        title="Görevlerim"
        description="Size atanan işleri kabul edin, bitirdiğinizde kontrole gönderin."
      />

      {error && (
        <p className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-rose-700">
          Görevler yüklenemedi. Sayfayı yenileyip tekrar deneyin.
        </p>
      )}

      <div className="space-y-6">
        <section className={`${card} p-6 sm:p-7`}>
          <SectionTitle title="Onay bekleyenler" count={waiting.length} />
          <TaskList
            tasks={waiting}
            userId={userId}
            mode="assignee"
            empty="Kabul etmenizi bekleyen görev yok."
          />
        </section>

        <section className={`${card} p-6 sm:p-7`}>
          <SectionTitle title="Üzerimdeki işler" count={working.length} />
          <TaskList
            tasks={working}
            userId={userId}
            mode="assignee"
            empty="Şu an üzerinizde iş yok."
          />
        </section>

        <section className={`${card} p-6 sm:p-7`}>
          <SectionTitle title="Tamamlananlar" count={done.length} />
          <TaskList
            tasks={done}
            userId={userId}
            mode="assignee"
            empty="Henüz tamamlanan işiniz yok."
          />
        </section>
      </div>
    </>
  );
}
