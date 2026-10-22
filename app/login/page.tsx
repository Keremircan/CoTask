import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Giriş Yap · CoTask",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))] dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 text-center">
          <Logo size={56} className="mx-auto mb-3" />
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            CoTask
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Devam etmek için hesabınızla giriş yapın.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
