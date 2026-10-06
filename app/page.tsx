import { NightHero } from "@/components/NightHero";
import { Page, PublicHeader, SectionLabel, StickyAction } from "@/components/Layout";
import { PaymentCallout } from "@/components/PaymentCallout";
import { PiggyBank } from "@/components/PiggyBank";
import { PlayerList } from "@/components/PlayerList";
import { Schedule } from "@/components/Schedule";
import { formatCents } from "@/lib/money";
import { getCurrentSeason, getNightList, getNights, getPiggyBank, pickNextNight } from "@/lib/queries";

export default async function Home() {
  const season = await getCurrentSeason();
  if (!season) {
    return (
      <>
        <PublicHeader />
        <Page>
          <p className="rounded-xl bg-sunken p-6 text-center text-muted">Season registration will start soon.</p>
        </Page>
      </>
    );
  }

  const nights = await getNights(season.id);
  const next = pickNextNight(nights);
  const list = next ? await getNightList(next.id) : [];
  const piggyBank = await getPiggyBank(season.id);

  return (
    <>
      <PublicHeader subtitle={season.name} />
      <Page>
        {next ? (
          <div className="flex flex-col gap-4 rounded-2xl bg-sunken p-3">
            <NightHero night={next} label="Next game" />
            <section>
              <SectionLabel>Who&apos;s in</SectionLabel>
              <PlayerList rows={list} />
            </section>
          </div>
        ) : (
          <p className="rounded-xl bg-sunken p-6 text-center text-muted">
            {nights.length ? "Season's over. See you next year." : "No nights booked yet."}
          </p>
        )}

        <section>
          <SectionLabel>Schedule</SectionLabel>
          <Schedule nights={nights} currentId={next?.id} />
        </section>

        <div className="flex flex-col gap-4 rounded-2xl border bg-sunken p-3">
          <section>
            <SectionLabel>Prices</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-surface p-4">
                <p className="text-sm text-muted">Whole season</p>
                <p className="font-display text-2xl font-bold tabular-nums">{formatCents(season.season_price_cents)}</p>
              </div>
              <div className="rounded-xl border bg-surface p-4">
                <p className="text-sm text-muted">One night</p>
                <p className="font-display text-2xl font-bold tabular-nums">{formatCents(season.night_price_cents)}</p>
              </div>
            </div>
          </section>

          <PaymentCallout email={season.etransfer_email} note={season.payment_note} />
        </div>

        {piggyBank && <PiggyBank data={piggyBank} />}
      </Page>
      <StickyAction href={next ? `/join?night=${next.id}` : "/join"}>Get on the list</StickyAction>
    </>
  );
}
