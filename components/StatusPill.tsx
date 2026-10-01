import type { Status } from "@/lib/types";

const STYLE: Record<Status, string> = {
  paid: "bg-paid-soft text-paid border-transparent",
  pending: "bg-owing-soft text-owing border-transparent",
  not_paid: "bg-surface text-danger border-danger",
  waived: "bg-sunken text-muted border-transparent",
};

export const STATUS_LABEL: Record<Status, string> = {
  paid: "Paid",
  pending: "Pending",
  not_paid: "Not paid",
  waived: "Waived",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function BookingBadge({ status }: { status: "planned" | "booked" }) {
  const booked = status === "booked";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${booked ? "bg-paid-soft text-paid" : "bg-owing-soft text-owing"}`}
    >
      {booked ? "Booked" : "Planned"}
    </span>
  );
}
