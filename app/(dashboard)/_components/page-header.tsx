export function PageHeader({
  title,
  label = "PANO",
}: {
  title: string;
  label?: string;
}) {
  return (
    <header className="mb-7">
      <p className="text-[13px] font-medium tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <h1 className="mt-1 text-[32px] leading-tight font-bold tracking-tight text-slate-900">
        {title}
      </h1>
    </header>
  );
}
