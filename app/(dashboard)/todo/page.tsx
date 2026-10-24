import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { card } from "@/components/ui/styles";
import { TodoBoard } from "@/components/todo/todo-board";
import { PageHeader } from "../_components/page-header";

export const metadata: Metadata = { title: "Yapılacaklar · Em3Task" };

export default function TodoPage() {
  return (
    <>
      <PageHeader
        title="Yapılacaklar"
        label="KİŞİSEL"
        description="Sadece sizin görebildiğiniz kişisel yapılacaklar listesi."
      />
      <Suspense fallback={<TodoSkeleton />}>
        <Todos />
      </Suspense>
    </>
  );
}

async function Todos() {
  const userId = await getUserId();
  const supabase = await createClient();

  // RLS zaten sadece kendi satırlarını döndürür; user_id filtresi ek güvence
  const [{ data: todos, error }, projects] = await Promise.all([
    supabase
      .from("personal_todos")
      .select("id, title, category, is_completed, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    getProjects(),
  ]);

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          Liste yüklenemedi. Sayfayı yenileyip tekrar deneyin.
        </p>
      )}
      <TodoBoard todos={todos ?? []} projectNames={projects.map((p) => p.name)} />
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Lock className="size-3.5" /> Bu liste size özel; ekipteki kimse (Admin dahil) göremez.
      </p>
    </>
  );
}

function TodoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className={`${card} h-20`} />
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        <div className={`${card} h-40`} />
        <div className={`${card} h-40`} />
      </div>
    </div>
  );
}
