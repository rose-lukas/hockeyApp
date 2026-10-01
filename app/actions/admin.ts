"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendly, type ActionState } from "@/lib/errors";
import { parseDollarsToCents } from "@/lib/money";
import { date, fields, id, kind, name, shortText, status, time } from "@/lib/schemas";
import { rpc, supabaseServer } from "@/lib/supabase";

async function call(fn: string, args: Record<string, unknown>, done: string): Promise<ActionState> {
  const { error } = await rpc(fn, args);
  if (error) return { ok: false, message: friendly(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: done };
}

function parse<T extends z.ZodType>(schema: T, form: FormData) {
  const r = schema.safeParse(fields(form));
  return r.success
    ? ({ ok: true, data: r.data } as const)
    : ({ ok: false, state: { ok: false, message: r.error.issues[0].message } satisfies ActionState } as const);
}

const cents = z.string().transform((v, ctx) => {
  const c = parseDollarsToCents(v);
  if (c === null) ctx.addIssue({ code: "custom", message: "Enter an amount like 20 or 187.25." });
  return c ?? 0;
});

// ── auth ──

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const p = parse(z.object({ email: z.email("Enter your email."), password: z.string().min(1, "Enter your password.") }), form);
  if (!p.ok) return p.state;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(p.data);
  if (error) return { ok: false, message: "That email and password didn't match." };
  redirect("/admin");
}

export async function logout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

// ── statuses and amounts ──

export async function setStatus(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ kind, id, status }), form);
  if (!p.ok) return p.state;
  return call("set_status", { p_kind: p.data.kind, p_id: p.data.id, p_status: p.data.status }, "Updated.");
}

export async function setAmount(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ kind, id, amount: cents }), form);
  if (!p.ok) return p.state;
  return call("set_amount", { p_kind: p.data.kind, p_id: p.data.id, p_amount_cents: p.data.amount }, "Amount saved.");
}

// ── nightly lists ──

export async function addToNight(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ name, nightId: id }), form);
  if (!p.ok) return p.state;
  return call("admin_add_to_night", { p_name: p.data.name, p_night_id: p.data.nightId }, `Added ${p.data.name}.`);
}

export async function removeFromNight(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ nightId: id, playerId: id }), form);
  if (!p.ok) return p.state;
  return call("remove_from_night", { p_night_id: p.data.nightId, p_player_id: p.data.playerId }, "Removed from this night.");
}

export async function restoreToNight(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ nightId: id, playerId: id }), form);
  if (!p.ok) return p.state;
  return call("restore_to_night", { p_night_id: p.data.nightId, p_player_id: p.data.playerId }, "Back on the list.");
}

// ── season passes ──

export async function addSeasonPass(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ name }), form);
  if (!p.ok) return p.state;
  return call("admin_add_season_pass", { p_name: p.data.name }, `${p.data.name} has a season pass.`);
}

export async function deleteSeasonPass(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ id }), form);
  if (!p.ok) return p.state;
  return call("delete_season_pass", { p_id: p.data.id }, "Season pass removed.");
}

// ── nights ──

export async function saveNight(_prev: ActionState, form: FormData) {
  const p = parse(
    z.object({ id: id.optional().or(z.literal("").transform(() => undefined)), date, time, arena: shortText(80), note: shortText(200) }),
    form,
  );
  if (!p.ok) return p.state;
  const { id: nightId, ...d } = p.data;
  return call(
    "save_night",
    { p_id: nightId ?? null, p_date: d.date, p_time: d.time, p_arena: d.arena, p_note: d.note },
    nightId ? "Night saved." : "Night added.",
  );
}

export async function setNightStatus(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ id, status: z.enum(["scheduled", "cancelled"]) }), form);
  if (!p.ok) return p.state;
  return call("set_night_status", { p_id: p.data.id, p_status: p.data.status },
    p.data.status === "cancelled" ? "Night cancelled." : "Night back on.");
}

export async function setNightBookingStatus(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ id, status: z.enum(["planned", "booked"]) }), form);
  if (!p.ok) return p.state;
  return call("set_night_booking_status", { p_id: p.data.id, p_status: p.data.status },
    p.data.status === "booked" ? "Marked as booked." : "Marked as planned.");
}

export async function deleteNight(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ id }), form);
  if (!p.ok) return p.state;
  const r = await call("delete_night", { p_id: p.data.id }, "Night deleted.");
  if (r?.ok) redirect("/admin/nights");
  return r;
}

// ── players ──

export async function renamePlayer(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ id, name }), form);
  if (!p.ok) return p.state;
  return call("rename_player", { p_id: p.data.id, p_name: p.data.name }, "Renamed.");
}

export async function mergePlayers(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ keep: id, drop: z.uuid("Pick who to merge in.") }), form);
  if (!p.ok) return p.state;
  return call("merge_players", { p_keep: p.data.keep, p_drop: p.data.drop }, "Merged.");
}

export async function deletePlayer(_prev: ActionState, form: FormData) {
  const p = parse(z.object({ id }), form);
  if (!p.ok) return p.state;
  return call("delete_player", { p_id: p.data.id }, "Player deleted.");
}

// ── season ──

const seasonFields = z.object({
  name: z.string().trim().min(1, "Give the season a name.").max(60),
  seasonPrice: cents,
  nightPrice: cents,
  email: z.union([z.literal(""), z.email("That e-transfer email doesn't look right.")]),
  note: shortText(500),
});

const seasonArgs = (d: z.infer<typeof seasonFields>) => ({
  p_name: d.name, p_season_price_cents: d.seasonPrice, p_night_price_cents: d.nightPrice,
  p_etransfer_email: d.email, p_payment_note: d.note,
});

export async function updateSeason(_prev: ActionState, form: FormData) {
  const p = parse(seasonFields, form);
  if (!p.ok) return p.state;
  return call("update_season", seasonArgs(p.data), "Settings saved. New prices apply to new sign-ups only.");
}

export async function startSeason(_prev: ActionState, form: FormData) {
  const p = parse(seasonFields, form);
  if (!p.ok) return p.state;
  return call("start_season", seasonArgs(p.data), `${p.data.name} is open.`);
}

export async function closeSeason(_prev: ActionState, _form: FormData) {
  return call("close_season", {}, "Season closed. The site now shows \"no season\" until you open a new one.");
}
