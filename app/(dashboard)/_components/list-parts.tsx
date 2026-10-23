import { card } from "@/components/ui/styles";
import { PageHeader } from "./page-header";

export function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <span className="text-sm text-slate-500">{count} iş</span>
    </div>
  );
}

export function ListSkeleton({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className={`${card} animate-pulse space-y-4 p-5`}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-2/3 rounded bg-slate-100" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </>
  );
}
