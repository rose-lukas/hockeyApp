import { formatLongDay, formatTime } from "@/lib/time";
import type { NightSummary } from "@/lib/types";
import { BookingBadge } from "./StatusPill";
import { formatNightHeader, formatWeekday } from "@/lib/time";

export function NightHero({ night, label }: { night: NightSummary; label: string }) {
  const cancelled = night.status === "cancelled";
  return (
    <section
      className="rounded-[18px] bg-chrome-photo p-5 text-action-text"
      style={{ "--hero-photo": "url(/images/rink-hero.jpg)" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold uppercase tracking-wider opacity-75">{label}</p>
        {!cancelled && <BookingBadge status={night.booking_status} />}
      </div>
      <p className={`mt-1 font-display text-3xl font-extrabold leading-tight ${cancelled ? "line-through opacity-70" : ""}`}>
        {formatNightHeader(night.faceoff_at)}
      </p>
      <p className="mt-1 text-[15px] opacity-85">
        {formatWeekday(night.faceoff_at)}
        {night.arena && ` · ${night.arena}`}
      </p>
      {cancelled ? (
        <p className="mt-3 font-semibold">This night is cancelled.</p>
      ) : (
        <p className="mt-3 font-display text-lg font-bold tabular-nums">
          {night.headcount} on the list · {night.paid_count} paid
        </p>
      )}
      {night.note && <p className="mt-2 text-sm opacity-85">{night.note}</p>}
    </section>
  );
}
