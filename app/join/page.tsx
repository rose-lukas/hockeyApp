import Link from "next/link";
import { Page, PublicHeader } from "@/components/Layout";
import { getCurrentSeason, getNights } from "@/lib/queries";
import { formatDay, formatTime } from "@/lib/time";
import { JoinForm } from "./JoinForm";

export const metadata = { title: "Get on the list · Saturday Night Hockey App" };

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const { night } = await searchParams;
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <>
        <PublicHeader />
        <Page>
          <Link href="/" className="-mb-4 min-h-11 self-start py-2 text-sm font-semibold text-accent">
            ← Back
          </Link>
          <p className="rounded-xl bg-sunken p-6 text-center text-muted">Season registration will start soon.</p>
        </Page>
      </>
    );
  }

  const now = Date.now();
  const upcoming = (await getNights(season.id))
    .filter((n) => n.status === "scheduled" && Date.parse(n.faceoff_at) > now)
    .map((n) => ({ id: n.id, label: `${formatDay(n.faceoff_at)} · ${formatTime(n.faceoff_at)}${n.arena ? ` · ${n.arena}` : ""}` }));

  return (
    <>
      <PublicHeader />
      <Page>
        <Link href="/" className="-mb-4 min-h-11 self-start py-2 text-sm font-semibold text-accent">
          ← Back
        </Link>
        <JoinForm
          nights={upcoming}
          defaultNight={typeof night === "string" ? night : undefined}
          seasonPriceCents={season.season_price_cents}
          nightPriceCents={season.night_price_cents}
          etransferEmail={season.etransfer_email}
          paymentNote={season.payment_note}
        />
      </Page>
    </>
  );
}
