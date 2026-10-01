"use server";

import { revalidatePath } from "next/cache";
import { friendly } from "@/lib/errors";
import { fields, joinForm } from "@/lib/schemas";
import { rpc } from "@/lib/supabase";
import type { JoinResult } from "@/lib/types";

export type JoinState = { ok: true; result: JoinResult } | { ok: false; message: string } | null;

export async function joinAction(_prev: JoinState, form: FormData): Promise<JoinState> {
  const parsed = joinForm.safeParse(fields(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const input = parsed.data;
  const { data, error } =
    input.kind === "season"
      ? await rpc<JoinResult>("join_season", { p_name: input.name })
      : await rpc<JoinResult>("join_night", { p_name: input.name, p_night_id: input.nightId });

  if (error || !data) return { ok: false, message: error ? friendly(error) : "Something went wrong." };
  revalidatePath("/", "layout");
  return { ok: true, result: data };
}
