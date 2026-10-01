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
