import { formatLongDay, formatTime } from "@/lib/time";
import type { NightSummary } from "@/lib/types";
import { BookingBadge } from "./StatusPill";
import { formatNightHeader, formatWeekday } from "@/lib/time";

export function NightHero({ night, label, prominent = false }: { night: NightSummary; label: string; prominent?: boolean }) {
  const cancelled = night.status === "cancelled";
  return (
    <section
      className={`flex flex-col justify-between rounded-[18px] bg-chrome-photo p-6 text-fg dark:text-action-text sm:p-8 ${prominent ? "min-h-[30rem]" : "min-h-60"}`}
      style={{ "--hero-photo": "url(/images/rink-hero.jpg)" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`heading-display font-bold uppercase tracking-wider opacity-75 ${prominent ? "text-xl" : "text-[13px]"}`}>{label}</p>
        {!cancelled && <BookingBadge status={night.booking_status} />}
      </div>
      <div className={prominent ? "mt-auto flex flex-col justify-end pb-1" : "mt-4"}>
        <p className={`font-display ${prominent ? "text-5xl" : "text-4xl"} font-extrabold leading-tight ${cancelled ? "line-through opacity-70" : ""}`}>
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
      </div>
    </section>
  );
}
