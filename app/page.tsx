import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./login/actions";

// Geçici yer tutucu: 3. aşamada pano ile değiştirilecek.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Oturum istek anında okunur; Cache Components bunu Suspense içinde ister */}
        <Suspense fallback={<UserCardSkeleton />}>
          <UserCard />
        </Suspense>
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          Pano yakında burada olacak.
        </p>
        <form action={logout} className="mt-6">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Çıkış Yap
          </button>
        </form>
      </div>
    </main>
  );
}

async function UserCard() {
  const supabase = await createClient();

  // proxy.ts zaten yönlendiriyor; sayfa da oturumu ayrıca doğrular.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Hoş geldin</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {profile?.full_name || user.email}
      </h1>
      {profile?.full_name && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {user.email}
        </p>
      )}
    </>
  );
}

function UserCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-2">
      <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-7 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
