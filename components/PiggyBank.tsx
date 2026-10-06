import { formatCents } from "@/lib/money";
import type { PiggyBank as PiggyBankData } from "@/lib/types";

export function PiggyBank({ data }: { data: PiggyBankData }) {
  const balance = data.money_in_cents - data.booked_cost_cents;
  const short = balance < 0;
  const costPerRink = data.booked_night_count > 0 ? Math.round(data.booked_cost_cents / data.booked_night_count) : data.default_rink_cost_cents;

  return (
    <section className="rounded-xl bg-sunken p-4" aria-labelledby="piggy-heading">
      <h2 id="piggy-heading" className="text-[13px] font-bold uppercase tracking-wider text-muted">
        Piggy Bank
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-muted">Money in</p>
          <p className="font-display text-xl font-bold tabular-nums">{formatCents(data.money_in_cents)}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Booked rinks cost</p>
          <p className="font-display text-xl font-bold tabular-nums">{formatCents(data.booked_cost_cents)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between rounded-lg bg-surface px-3 py-2">
        <span className="text-sm font-semibold">Balance</span>
        <span className={`font-display text-xl font-bold tabular-nums ${short ? "text-owing" : "text-paid"}`}>
          {formatCents(balance)}
        </span>
      </div>

      <dl className="mt-3 flex flex-col gap-1 text-sm text-muted">
        <div className="flex justify-between">
          <dt>Cost of a booked rink</dt>
          <dd className="tabular-nums">{formatCents(costPerRink)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Nights booked</dt>
          <dd className="tabular-nums">{data.booked_night_count}</dd>
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

      <p className="mt-3 text-xs text-muted">Only nights marked &ldquo;Booked&rdquo; count toward costs and the balance.</p>
    </section>
  );
}
