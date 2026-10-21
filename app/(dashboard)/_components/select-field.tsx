import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { field } from "./ui";

// Tarayıcının varsayılan okunu gizleyip yerine kendi ikonumuzu koyar
export function SelectField({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${field} h-14 appearance-none pr-12 ${className}`}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 mt-1 size-5 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}
