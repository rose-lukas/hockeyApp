import Link from "next/link";
import { saveNight } from "@/app/actions/admin";
import { ActionForm, Submit } from "@/components/ActionForm";
import { Card, H1 } from "@/components/Admin";
import { Field } from "@/components/Field";
import { BookingBadge } from "@/components/StatusPill";
import { getCurrentSeason, getNights } from "@/lib/queries";
import { formatDay, formatTime, nextSaturday, toLocalInputs } from "@/lib/time";

export default async function NightsPage() {
  const season = await getCurrentSeason();
  if (!season) return <Card>Start a season in <Link href="/admin/settings" className="text-accent">Settings</Link> first.</Card>;

  const nights = await getNights(season.id);
  const last = nights.at(-1);
  const lastLocal = last ? toLocalInputs(last.faceoff_at) : null;

  return (
    <>
      <H1>Nights</H1>

      <Card>
        <h2 className="mb-3 font-semibold">Add a night</h2>
        <ActionForm action={saveNight} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" name="date" type="date" required defaultValue={nextSaturday()} />
            <Field label="Faceoff" name="time" type="time" required defaultValue={lastLocal?.time ?? "21:00"} />
          </div>
          <Field label="Arena" name="arena" maxLength={80} defaultValue={last?.arena ?? ""} />
          <Field label="Note (optional)" name="note" maxLength={200} />
          <Field label="Rink cost override ($, optional)" name="rinkCost" inputMode="decimal"
            hint="Leave blank to use the season's default rink cost." />
          <Submit>Add night</Submit>
        </ActionForm>
      </Card>

      <ul className="divide-y overflow-hidden rounded-xl border bg-surface">
        {nights.length === 0 && <li className="p-4 text-muted">No nights yet.</li>}
        {nights.map((n) => (
          <li key={n.id}>
            <Link href={`/admin/nights/${n.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5">
              <span className={n.status === "cancelled" ? "text-muted line-through" : ""}>
                <span className="font-semibold">{formatDay(n.faceoff_at)}</span>
                <span className="ml-2 text-sm text-muted">{formatTime(n.faceoff_at)}{n.arena && ` · ${n.arena}`}</span>
              </span>
              <span className="flex items-center gap-2">
                <BookingBadge status={n.booking_status} />
                <span className="text-sm tabular-nums text-muted">{n.paid_count}/{n.headcount} paid ›</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
