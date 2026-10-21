import Link from "next/link";
import { SearchX } from "lucide-react";
import { card, primaryButton } from "@/components/ui/styles";

export default function ProjectNotFound() {
  return (
    <section className={`${card} mx-auto mt-10 max-w-lg p-8 text-center`}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchX className="size-6" />
      </div>
      <h1 className="mt-4 text-[22px] font-bold text-slate-900">Proje bulunamadı</h1>
      <p className="mt-2 text-slate-500">Bu proje silinmiş ya da bağlantı hatalı olabilir.</p>
      <Link href="/" className={`${primaryButton} mt-6`}>
        Ana sayfaya dön
      </Link>
    </section>
  );
}
