import { supabaseServer } from "./supabase";
import type { ListRow, NightSummary, PiggyBank, Season, Status } from "./types";

export async function getCurrentSeason() {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("season").select("*").eq("is_current", true).maybeSingle();
  return data as Season | null;
}

export async function getNights(seasonId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("v_night_summary")
    .select("*")
    .eq("season_id", seasonId)
    .order("faceoff_at");
  return (data ?? []) as NightSummary[];
}

export async function getNight(id: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("v_night_summary").select("*").eq("id", id).maybeSingle();
  return data as NightSummary | null;
}

export async function getNightList(nightId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("v_night_list").select("*").eq("night_id", nightId).order("name");
  return (data ?? []) as ListRow[];
}

/** First night that hasn't finished yet; a game counts as "next" until 2h after faceoff. */
export function pickNextNight(nights: NightSummary[], now = Date.now()) {
  return nights.find((n) => n.status === "scheduled" && Date.parse(n.faceoff_at) + 2 * 3600_000 > now) ?? null;
}

export async function getPiggyBank(seasonId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("v_piggy_bank").select("*").eq("season_id", seasonId).maybeSingle();
  return data as PiggyBank | null;
}

// ── admin ──

export type PendingRow = {
  kind: "season" | "night";
  enrolment_id: string;
  player_id: string;
  name: string;
  amount_cents: number;
  created_at: string;
  night_id: string | null;
  faceoff_at: string | null;
};

export async function getPending() {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("v_pending").select("*").order("faceoff_at", { nullsFirst: true }).order("name");
  return (data ?? []) as PendingRow[];
}

export type PassRow = { id: string; status: Status; amount_cents: number; player: { id: string; name: string } };

export async function getSeasonPasses(seasonId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("season_pass")
    .select("id, status, amount_cents, player:player_id (id, name)")
    .eq("season_id", seasonId);
  return ((data ?? []) as unknown as PassRow[]).sort((a, b) => a.player.name.localeCompare(b.player.name));
}

export async function getPlayers() {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("player").select("id, name, created_at").order("name");
  return (data ?? []) as { id: string; name: string; created_at: string }[];
}

export async function getAbsences(nightId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("v_night_absence").select("*").eq("night_id", nightId).order("name");
  return (data ?? []) as { night_id: string; player_id: string; name: string }[];
}
