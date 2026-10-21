import type { ReactNode } from "react";

export function PageHeader({
  title,
  label = "PANO",
  description,
  action,
}: {
  title: string;
  label?: string;
  description?: string;
  action?: ReactNode; // sağ üstteki buton
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <h1 className="mt-1 text-[32px] leading-tight font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[15px] text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
