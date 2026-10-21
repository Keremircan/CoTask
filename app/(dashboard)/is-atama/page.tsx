import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getTeamMembers } from "@/lib/team";
import { PageHeader } from "../_components/page-header";
import { card } from "../_components/ui";
import { TaskForm } from "./task-form";

export const metadata: Metadata = { title: "İş atama · CoTask" };

export default function AssignPage() {
  return (
    <>
      <PageHeader title="İş atama" />
      <section className={`${card} max-w-[900px] p-7 sm:p-8`}>
        <h2 className="text-[30px] leading-tight font-bold tracking-tight text-slate-900">
          Yeni görev oluştur
        </h2>
        <p className="mt-2 mb-7 text-[17px] text-slate-500">
          Başlık, açıklama ve sorumlu kişiyi seçerek işi atayın.
        </p>
        <Suspense fallback={<FormSkeleton />}>
          <FormWithMembers />
        </Suspense>
      </section>
    </>
  );
}

async function FormWithMembers() {
  await getCurrentUser();
  const members = await getTeamMembers();
  return <TaskForm members={members} />;
}

function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {[56, 140, 56].map((h, i) => (
        <div key={i}>
          <div className="h-4 w-28 rounded bg-slate-100" />
          <div className="mt-2 rounded-xl bg-slate-100" style={{ height: h }} />
        </div>
      ))}
      <div className="h-13 w-32 rounded-xl bg-slate-100" />
    </div>
  );
}
