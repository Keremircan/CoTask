import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Client Component'lerde ("use client") kullanılır.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
