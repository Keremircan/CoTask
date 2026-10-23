import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { getTaskFormOptions, TASK_LIST_SELECT } from "@/lib/task-queries";
import { card } from "@/components/ui/styles";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { TaskList } from "@/components/tasks/task-list";
import { PageHeader } from "../_components/page-header";
import { ListSkeleton, SectionTitle } from "../_components/list-parts";

export const metadata: Metadata = { title: "Atadığım Görevler · CoTask" };

export default function AssignedByMePage() {
  return (
    <Suspense fallback={<ListSkeleton title="Atadığım görevler" />}>
      <AssignedByMe />
    </Suspense>
  );
}

async function AssignedByMe() {
  const userId = await getUserId(); // yerel, Supabase isteği yok
  const supabase = await createClient();

  const [{ data: tasks, error }, formOptions] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_LIST_SELECT)
      .eq("created_by", userId)
      .order("created_at", { ascending: false }),
    getTaskFormOptions(),
  ]);

  const all = tasks ?? [];
  const active = all.filter((t) => t.status !== "done");
  const done = all.filter((t) => t.status === "done");

  return (
    <>
      <PageHeader
        title="Atadığım görevler"
        description="Atadığınız işleri buradan izleyin; kabul edilen işleri tamamlayın."
        action={<NewTaskButton options={formOptions} />}
      />

      {error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-2 text-rose-700">
          Görevler yüklenemedi. Sayfayı yenileyip tekrar deneyin.
        </p>
      )}

      <div className="space-y-4">
        <section className={`${card} p-4 sm:p-5`}>
          <SectionTitle title="Süren işler" count={active.length} />
          <TaskList
            tasks={active}
            userId={userId}
            mode="owner"
            formOptions={formOptions}
            empty="Süren bir işiniz yok. Sağ üstteki “Yeni İş Ata” ile başlayın."
          />
        </section>

        <section className={`${card} p-4 sm:p-5`}>
          <SectionTitle title="Tamamlananlar" count={done.length} />
          <TaskList
            tasks={done}
            userId={userId}
            mode="owner"
            formOptions={formOptions}
            empty="Henüz tamamlanan iş yok."
          />
        </section>
      </div>
    </>
  );
}
