import { Suspense } from "react";
import Link from "next/link";
import {
  ChartNoAxesCombined,
  CircleCheck,
  CircleCheckBig,
  ClipboardClock,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "./_components/page-header";
import { card, primaryButton, secondaryButton } from "./_components/ui";

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Genel bakış" />

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className={`${card} p-7`}>
          <h2 className="text-[21px] font-bold text-slate-900">Ekip özeti</h2>
          <p className="mt-2 text-[17px] text-slate-600">
            Ekip arkadaşlarına iş ata, ilerlemeyi izle ve tamamlanan görevleri
            tek ekrandan yönet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/is-atama" className={primaryButton}>
              <CircleCheckBig className="size-5" strokeWidth={2.4} />
              Yeni iş ata
            </Link>
            <Link href="/is-takip" className={secondaryButton}>
              <ChartNoAxesCombined className="size-5" strokeWidth={2.4} />
              Takibe git
            </Link>
          </div>
        </section>

        <section className={`${card} p-7`}>
          <h2 className="text-[21px] font-bold text-slate-900">
            Nasıl çalışır?
          </h2>
          <ol className="mt-2 space-y-2 text-[17px] text-slate-600">
            <li>1. Ekip üyesini seçip iş oluşturun.</li>
            <li>2. Ekip üyesi işi okur ve durumunu günceller.</li>
            <li>3. Takip ekranından tüm işlerin durumunu görün.</li>
          </ol>
        </section>
      </div>
    </>
  );
}

async function Stats() {
  await getCurrentUser(); // oturum yoksa /login'e yönlendirir
  const supabase = await createClient();

  const [members, total, open, done] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .neq("status", "done"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "done"),
  ]);

  const items: StatItem[] = [
    {
      value: members.count ?? 0,
      label: "Ekip üyesi",
      icon: Users,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      value: total.count ?? 0,
      label: "Toplam iş",
      icon: ClipboardList,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      value: open.count ?? 0,
      label: "Devam eden",
      icon: ClipboardClock,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      value: done.count ?? 0,
      label: "Tamamlanan",
      icon: CircleCheck,
      tone: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}

type StatItem = {
  value: number;
  label: string;
  icon: LucideIcon;
  tone: string;
};

function StatCard({ value, label, icon: Icon, tone }: StatItem) {
  return (
    <div className={`${card} flex items-center gap-5 p-6`}>
      <div
        className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${tone}`}
      >
        <Icon className="size-6" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[28px] leading-none font-bold text-slate-900">
          {value}
        </p>
        <p className="mt-1.5 text-[16px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`${card} flex animate-pulse items-center gap-5 p-6`}>
          <div className="size-14 rounded-2xl bg-slate-100" />
          <div className="flex flex-col gap-2">
            <div className="h-7 w-10 rounded bg-slate-100" />
            <div className="h-4 w-24 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
