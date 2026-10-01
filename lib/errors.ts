import type { PostgrestError } from "@supabase/supabase-js";

export type ActionState = { ok: boolean; message: string } | null;

// Codes our RPCs raise with human-readable messages; anything else stays server-side.
const FRIENDLY = new Set(["P0001", "P0002", "22023", "23505"]);

export function friendly(error: PostgrestError | { code?: string; message: string }): string {
  if (error.code && FRIENDLY.has(error.code)) return error.message;
  if (error.code === "42501") return "You need to be logged in as the organiser.";
  console.error("[rpc]", error);
  return "Something went wrong. Try again.";
}
