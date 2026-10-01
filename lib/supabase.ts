import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// A new client per request; never cached across requests (auth cookies are per-user).
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server Components can't write cookies; proxy.ts refreshes the session instead.
          }
        },
      },
    },
  );
}

export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.schema("api").rpc(fn, args);
  return { data: data as T | null, error };
}
