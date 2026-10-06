export type Status = "pending" | "paid" | "not_paid" | "waived";
export type Kind = "season" | "night";

export const STATUSES: Status[] = ["pending", "paid", "not_paid", "waived"];

export type Season = {
  id: string;
  name: string;
  season_price_cents: number;
  night_price_cents: number;
  etransfer_email: string;
  payment_note: string;
  default_rink_cost_cents: number;
};

export type NightSummary = {
  id: string;
  season_id: string;
  faceoff_at: string;
  arena: string;
  note: string;
  status: "scheduled" | "cancelled";
  headcount: number;
  paid_count: number;
  booking_status: "planned" | "booked";
  rink_cost_cents: number;
};

export type PiggyBank = {
  season_id: string;
  money_in_cents: number;
  booked_cost_cents: number;
  booked_night_count: number;
  default_rink_cost_cents: number;
  season_payer_count: number;
  night_payer_count: number;
};

export type ListRow = {
  night_id: string;
  player_id: string;
  name: string;
  kind: Kind;
  enrolment_id: string;
  status: Status;
  amount_cents: number;
};

export type JoinResult = {
  created: boolean;
  kind: Kind;
  name: string;
  status: Status;
  amount_cents: number;
  faceoff_at?: string;
  etransfer_email: string;
  payment_note: string;
};
