import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  ClipboardClock,
  FolderKanban,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getUserId } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { card } from "@/components/ui/styles";
import { StatusBadge } from "@/components/tasks/status-badge";
import type { TaskPriority, TaskStatus } from "@/types/database";
import { PriorityBadge } from "@/components/tasks/priority";
import { PageHeader } from "./_components/page-header";

export default function HomePage() {
  return (
    <>
      <PageHeader title="Ana sayfa" />

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<div className={`${card} mt-6 h-64 animate-pulse`} />}>
        <Inbox />
      </Suspense>

      <section className={`${card} mt-6 p-7`}>
        <h2 className="text-[20px] font-bold text-slate-900">Nasıl çalışır?</h2>
        <ol className="mt-3 grid gap-3 text-[15.5px] text-slate-600 md:grid-cols-2 xl:grid-cols-4">
          <Step n={1} title="İş ata">
            Atadığım Görevler’den projesini ve kişisini seçerek işi oluşturun. Görev
            “Onay Bekliyor” olarak başlar.
          </Step>
          <Step n={2} title="Kabul et">
            Görevi alan kişi Görevlerim’den kabul eder, görev “Yapılıyor” olur.
            “Herkes”e atanan işi ilk kabul eden üstlenir.
          </Step>
          <Step n={3} title="Kontrole gönder">
            İş bitince sadece görevi alan kişi “Kontrol”e gönderir.
          </Step>
          <Step n={4} title="Tamamla">
            Sadece görevi atayan kişi işi “Tamamlandı” yapar. Ekip her aşamada
            görev altında konuşur, dosya ve link paylaşır.
          </Step>
        </ol>
      </section>
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl bg-slate-50 p-4">
      <p className="flex items-center gap-2 font-bold text-slate-900">
        <span className="flex size-6 items-center justify-center rounded-full bg-teal-600 text-xs text-white">
          {n}
        </span>
        {title}
      </p>
      <p className="mt-1.5 text-[14.5px] leading-relaxed">{children}</p>
    </li>
  );
}

async function Stats() {
  await getUserId(); // oturum kontrolü (yerel, Supabase isteği yok)
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };

  const [members, projects, open, done] = await Promise.all([
    supabase.from("profiles").select("*", head),
    supabase.from("projects").select("*", head),
    supabase.from("tasks").select("*", head).neq("status", "done"),
    supabase.from("tasks").select("*", head).eq("status", "done"),
  ]);

  const items: StatItem[] = [
    { value: members.count ?? 0, label: "Ekip üyesi", icon: Users, tone: "bg-teal-50 text-teal-700" },
    { value: projects.count ?? 0, label: "Proje", icon: FolderKanban, tone: "bg-sky-50 text-sky-600" },
    { value: open.count ?? 0, label: "Süren iş", icon: ClipboardClock, tone: "bg-amber-50 text-amber-600" },
    { value: done.count ?? 0, label: "Tamamlanan", icon: CircleCheck, tone: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}

// Kullanıcıdan aksiyon bekleyen işler
async function Inbox() {
  const userId = await getUserId();
  const supabase = await createClient();
  const fields = "id, title, status, priority, created_at, project:projects!tasks_project_id_fkey(name)";

  const [waitingRes, reviewRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(fields)
      .eq("status", "pending")
      .or(`assigned_to.eq.${userId},assigned_to.is.null`)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("tasks")
      .select(fields)
      .eq("created_by", userId)
      .eq("status", "review")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <InboxCard
        title="Kabulünü bekleyen görevler"
        href="/gorevlerim"
        linkLabel="Görevlerim"
        empty="Kabul etmenizi bekleyen görev yok."
        tasks={waitingRes.data ?? []}
      />
      <InboxCard
        title="Kontrolünüzü bekleyen görevler"
        href="/atadigim-gorevler"
        linkLabel="Atadığım Görevler"
        empty="Kontrolünüzü bekleyen görev yok."
        tasks={reviewRes.data ?? []}
      />
    </div>
  );
}

type InboxTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  project: { name: string } | null;
};

function InboxCard({
  title,
  href,
  linkLabel,
  empty,
  tasks,
}: {
  title: string;
  href: string;
  linkLabel: string;
  empty: string;
  tasks: InboxTask[];
}) {
  return (
    <section className={`${card} p-6 sm:p-7`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold text-slate-900">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline"
        >
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[15px] text-slate-500">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link
                href={`/gorevler/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900">{t.title}</span>
                  <span className="block truncate text-sm text-slate-500">
                    {t.project?.name ?? "Projesiz"} · {formatDateTime(t.created_at)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <PriorityBadge priority={t.priority} size="xs" />
                  <StatusBadge status={t.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type StatItem = { value: number; label: string; icon: LucideIcon; tone: string };

function StatCard({ value, label, icon: Icon, tone }: StatItem) {
  return (
    <div className={`${card} flex items-center gap-5 p-6`}>
      <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="size-6" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[28px] leading-none font-bold text-slate-900">{value}</p>
        <p className="mt-1.5 text-[16px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`${card} h-[104px] animate-pulse`} />
      ))}
    </div>
  );
}
