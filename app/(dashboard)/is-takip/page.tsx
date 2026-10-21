import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ClipboardList, Search, UserRound } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getTeamMembers } from "@/lib/team";
import { isUuid, PRIORITY_LABELS } from "@/lib/tasks";
import { PageHeader } from "../_components/page-header";
import { SelectField } from "../_components/select-field";
import { card, fieldLabel, primaryButton } from "../_components/ui";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "İş takip · CoTask" };

export default function TrackPage({ searchParams }: PageProps<"/is-takip">) {
  return (
    <>
      <PageHeader title="İş takip" />
      {/* searchParams istek anında okunur; Suspense içinde kalmalı */}
      <Suspense fallback={<TrackSkeleton />}>
        <Tracker searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Tracker({
  searchParams,
}: Pick<PageProps<"/is-takip">, "searchParams">) {
  await getCurrentUser();
  const { uye } = await searchParams;
  const selectedId = isUuid(uye) ? uye : null;

  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(
      `id, title, description, status, priority, due_date, created_at,
       assignee:profiles!tasks_assigned_to_fkey(id, full_name),
       creator:profiles!tasks_created_by_fkey(full_name)`,
    )
    .order("created_at", { ascending: false });
  if (selectedId) query = query.eq("assigned_to", selectedId);

  const [members, { data: tasks, error }] = await Promise.all([
    getTeamMembers(),
    query,
  ]);

  const selectedName = members.find((m) => m.id === selectedId)?.name;

  return (
    <div className="space-y-7">
      {/* Ekip üyesi seçimi: düz GET formu, adres çubuğunda ?uye=... */}
      <section className={`${card} max-w-[900px] p-7 sm:p-8`}>
        <h2 className="text-[30px] leading-tight font-bold tracking-tight text-slate-900">
          Ekip üyesi seçin
        </h2>
        <p className="mt-2 mb-7 text-[17px] text-slate-500">
          Görev listesini görmek istediğiniz ekip üyesini seçin.
        </p>
        <form action="/is-takip" className="space-y-6">
          <div>
            <label htmlFor="uye" className={fieldLabel}>
              Ekip üyesi
            </label>
            <SelectField id="uye" name="uye" defaultValue={selectedId ?? ""}>
              <option value="">Tüm ekip</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </SelectField>
          </div>
          <button type="submit" className={primaryButton}>
            <Search className="size-5" strokeWidth={2.4} />
            İşleri göster
          </button>
        </form>
      </section>

      <section className={`${card} p-7 sm:p-8`}>
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[21px] font-bold text-slate-900">
            {selectedName ? `${selectedName} adlı üyenin işleri` : "Tüm ekibin işleri"}
          </h2>
          <span className="text-[15px] text-slate-500">
            {tasks?.length ?? 0} iş
          </span>
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-rose-700">
            İşler yüklenemedi. Sayfayı yenileyip tekrar deneyin.
          </p>
        ) : !tasks?.length ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="text-[17px] font-bold text-slate-900">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-[15px] text-slate-600">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="size-4" />
                      {task.assignee?.full_name ?? "Atanmamış"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" />
                      {formatDate(task.created_at)}
                    </span>
                    {task.creator?.full_name && (
                      <span>Atayan: {task.creator.full_name}</span>
                    )}
                    {task.priority !== "medium" && (
                      <span>Öncelik: {PRIORITY_LABELS[task.priority]}</span>
                    )}
                  </div>
                </div>
                <StatusSelect
                  taskId={task.id}
                  status={task.status}
                  title={task.title}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
        <ClipboardList className="size-6" />
      </div>
      <p className="mt-4 font-bold text-slate-900">Burada henüz iş yok</p>
      <p className="mt-1 text-[15px] text-slate-500">
        Yeni bir iş atadığınızda bu listede görünecek.
      </p>
      <Link
        href="/is-atama"
        className="mt-5 text-[15px] font-bold text-teal-700 hover:underline"
      >
        İş atamaya git →
      </Link>
    </div>
  );
}

function TrackSkeleton() {
  return (
    <div className="space-y-7">
      <div className={`${card} max-w-[900px] animate-pulse p-8`}>
        <div className="h-8 w-56 rounded bg-slate-100" />
        <div className="mt-3 h-4 w-80 rounded bg-slate-100" />
        <div className="mt-8 h-14 rounded-xl bg-slate-100" />
        <div className="mt-6 h-13 w-40 rounded-xl bg-slate-100" />
      </div>
      <div className={`${card} h-48 animate-pulse`} />
    </div>
  );
}
