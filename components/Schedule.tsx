import Link from "next/link";
import { formatScheduleLine } from "@/lib/time";
import type { NightSummary } from "@/lib/types";
import { BookingBadge } from "./StatusPill";

export function Schedule({ nights, currentId }: { nights: NightSummary[]; currentId?: string }) {
  if (nights.length === 0) {
    return <p className="rounded-xl bg-sunken p-4 text-center text-muted">No nights booked yet.</p>;
  }
  const now = Date.now();
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-surface">
      {nights.map((n) => {
        const done = Date.parse(n.faceoff_at) + 2 * 3600_000 < now;
        const cancelled = n.status === "cancelled";
        return (
          <li key={n.id}>
            <Link
              href={`/night/${n.id}`}
              aria-current={n.id === currentId ? "page" : undefined}
              className={`flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 ${done || cancelled ? "text-muted" : ""} ${n.id === currentId ? "bg-chrome-soft" : ""}`}
            >
              <span>
                <span className={`font-semibold ${cancelled ? "line-through" : ""}`}>{formatScheduleLine(n.faceoff_at)}</span>
                <span className="ml-2 text-sm text-muted">
                  {n.arena && `${n.arena}`}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {!cancelled && <BookingBadge status={n.booking_status} />}
                <span className="text-sm tabular-nums text-muted">
                  {cancelled ? "Cancelled" : `${n.headcount} in`}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
