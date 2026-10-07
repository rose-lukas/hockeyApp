import Link from "next/link";
import { Page, PublicHeader, SectionLabel } from "@/components/Layout";
import { formatCents } from "@/lib/money";
import { getCurrentSeason, getNightEntries, getNights, getPiggyBank, getPlayers, getSeasonPasses } from "@/lib/queries";
import { formatDay, formatScheduleLine } from "@/lib/time";

export default async function PiggyBankPage() {
  const season = await getCurrentSeason();
  if (!season) {
    return (
      <>
        <PublicHeader />
        <Page>
          <p className="rounded-xl bg-sunken p-6 text-center text-muted">No season is open yet.</p>
        </Page>
      </>
    );
  }

  const [nights, piggyBank, players, seasonPasses, nightEntries] = await Promise.all([
    getNights(season.id),
    getPiggyBank(season.id),
    getPlayers(),
    getSeasonPasses(season.id),
    getNightEntries(season.id),
  ]);

  if (!piggyBank) {
    return (
      <>
        <PublicHeader />
        <Page>
          <p className="rounded-xl bg-sunken p-6 text-center text-muted">Piggy Bank data is not available yet.</p>
        </Page>
      </>
    );
  }

  const playerMap = new Map(players.map((player) => [player.id, player.name]));
  const bookedNights = nights.filter((night) => night.booking_status === "booked");
  const balance = piggyBank.money_in_cents - piggyBank.booked_cost_cents;
  const owedRows = [
    ...seasonPasses
      .filter((item) => item.status !== "paid" && item.status !== "waived")
      .map((item) => ({
        label: item.player.name,
        detail: "Whole season",
        amount: item.amount_cents,
      })),
    ...nightEntries
      .filter((entry) => entry.status !== "paid" && entry.status !== "waived")
      .map((entry) => ({
        label: playerMap.get(entry.player.id) ?? "Unknown",
        detail: `Night · ${formatDay(entry.night_faceoff_at ?? new Date().toISOString())}`,
        amount: entry.amount_cents,
      })),
  ].sort((a, b) => b.amount - a.amount);

  return (
    <>
      <PublicHeader />
      <Page>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold">PIGGY B&#xF01C;NK</h1>
          <Link href="/" className="text-sm font-semibold text-accent">Back</Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-sunken p-4">
            <p className="text-xs text-muted">Received (+)</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-paid">{formatCents(piggyBank.money_in_cents)}</p>
          </div>
          <div className="rounded-xl bg-sunken p-4">
            <p className="text-xs text-muted">Games booked</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{piggyBank.booked_night_count}</p>
          </div>
          <div className="rounded-xl bg-sunken p-4">
            <p className="text-xs text-muted">Spent (-)</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-owing">{formatCents(piggyBank.booked_cost_cents)}</p>
          </div>
          <div className="rounded-xl bg-sunken p-4">
            <p className="text-xs text-muted">Balance</p>
            <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${balance < 0 ? "text-owing" : "text-paid"}`}>
              {formatCents(balance)}
            </p>
          </div>
        </div>

        <section>
          <SectionLabel>Who still owes</SectionLabel>
          {owedRows.length === 0 ? (
            <p className="rounded-xl bg-sunken p-4 text-muted">Everyone is paid up.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="bg-sunken text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Player</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {owedRows.map((row, index) => (
                    <tr key={`${row.label}-${row.detail}-${index}`} className="border-t border-subtle">
                      <td className="px-3 py-2 font-medium">{row.label}</td>
                      <td className="px-3 py-2 text-muted">{row.detail}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-owing">{formatCents(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <SectionLabel>Booked nights</SectionLabel>
          {bookedNights.length === 0 ? (
            <p className="rounded-xl bg-sunken p-4 text-muted">No nights are marked as booked yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="bg-sunken text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Arena</th>
                    <th className="px-3 py-2 text-right font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {bookedNights.map((night) => (
                    <tr key={night.id} className="border-t border-subtle">
                      <td className="px-3 py-2">{formatScheduleLine(night.faceoff_at)}</td>
                      <td className="px-3 py-2 text-muted">{night.arena || "Arena TBD"}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCents(night.rink_cost_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Page>
    </>
  );
}