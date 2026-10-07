import Link from "next/link";
import { formatCents } from "@/lib/money";
import type { PiggyBank as PiggyBankData } from "@/lib/types";

export function PiggyBank({ data }: { data: PiggyBankData }) {
  const balance = data.money_in_cents - data.booked_cost_cents;
  const short = balance < 0;
  const costPerRink = data.booked_night_count > 0 ? Math.round(data.booked_cost_cents / data.booked_night_count) : data.default_rink_cost_cents;

  return (
    <Link href="/piggy-bank" className="block rounded-xl bg-sunken p-4 transition hover:bg-surface/80" aria-labelledby="piggy-heading">
      <section aria-labelledby="piggy-heading">
        <h2 id="piggy-heading" className="text-xl font-bold uppercase tracking-wider text-muted">
          PIGGY B&#xF01C;NK
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">Received (+)</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums text-paid">{formatCents(data.money_in_cents)}</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">Games booked</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums">{data.booked_night_count}</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">Spent (-)</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums text-owing">{formatCents(data.booked_cost_cents)}</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">Balance</p>
            <p className={`mt-1 font-display text-xl font-bold tabular-nums ${short ? "text-owing" : "text-paid"}`}>
              {formatCents(balance)}
            </p>
          </div>
        </div>

        <dl className="mt-3 flex flex-col gap-1 text-sm text-muted">
          <div className="flex justify-between">
            <dt>Average rink cost</dt>
            <dd className="tabular-nums">{formatCents(costPerRink)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Whole season payers</dt>
            <dd className="tabular-nums">{data.season_payer_count}</dd>
          </div>
          <div className="flex justify-between">
            <dt>One-nighters</dt>
            <dd className="tabular-nums">{data.night_payer_count}</dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted">Tap to see details, who owes, and rink-by-rink costs.</p>
      </section>
    </Link>
  );
}
