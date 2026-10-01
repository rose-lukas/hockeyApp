import Link from "next/link";
import { AmountEditor, Card, H1, StatusButtons } from "@/components/Admin";
import { formatCents } from "@/lib/money";
import { getCurrentSeason, getPending } from "@/lib/queries";
import { formatDay } from "@/lib/time";

export default async function PendingPage() {
  const season = await getCurrentSeason();
  if (!season) {
    return (
      <Card>
        <p>No season is open yet.</p>
        <Link href="/admin/settings" className="mt-2 inline-block font-semibold text-accent">Start one in Settings →</Link>
      </Card>
    );
  }

  const pending = await getPending();
  const total = pending.reduce((s, p) => s + p.amount_cents, 0);

  return (
    <>
      <div>
        <H1>Waiting on payment</H1>
        <p className="mt-1 text-muted">
          {pending.length === 0
            ? "Nobody is pending. Everyone's sorted."
            : <>{pending.length} pending · <span className="tabular-nums">{formatCents(total)}</span> outstanding</>}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {pending.map((p) => (
          <li key={p.enrolment_id}>
            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm text-muted">
                  {p.kind === "season" ? "Season pass" : p.faceoff_at ? formatDay(p.faceoff_at) : "Night"}
                </span>
              </div>
              <AmountEditor kind={p.kind} id={p.enrolment_id} cents={p.amount_cents} />
              <StatusButtons kind={p.kind} id={p.enrolment_id} current="pending" />
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
