import { closeSeason, startSeason, updateSeason } from "@/app/actions/admin";
import { ActionForm, Submit } from "@/components/ActionForm";
import { Card, H1 } from "@/components/Admin";
import { Field } from "@/components/Field";
import { getCurrentSeason } from "@/lib/queries";
import type { Season } from "@/lib/types";

function SeasonFields({ s }: { s?: Season | null }) {
  const dollars = (c?: number) => (c === undefined ? "" : (c / 100).toFixed(2));
  return (
    <>
      <Field label="Season name" name="name" required maxLength={60} defaultValue={s?.name} placeholder="2026–27" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Season pass ($)" name="seasonPrice" inputMode="decimal" required defaultValue={dollars(s?.season_price_cents)} />
        <Field label="One night ($)" name="nightPrice" inputMode="decimal" required defaultValue={dollars(s?.night_price_cents ?? 2000)} />
      </div>
      <Field label="E-transfer email" name="email" type="email" maxLength={120} defaultValue={s?.etransfer_email} />
      <label className="block">
        <span className="text-sm font-semibold">Payment instructions</span>
        <textarea name="note" maxLength={500} rows={3} defaultValue={s?.payment_note}
          placeholder="e.g. Auto-deposit is on, no password needed."
          className="mt-1 block w-full rounded-lg border bg-surface p-3 text-fg placeholder:text-muted" />
      </label>
    </>
  );
}

export default async function SettingsPage() {
  const season = await getCurrentSeason();

  return (
    <>
      <H1>Settings</H1>

      {season && (
        <Card>
          <h2 className="mb-3 font-semibold">This season</h2>
          <ActionForm action={updateSeason} className="flex flex-col gap-3">
            <SeasonFields s={season} />
            <p className="text-xs text-muted">Price changes only apply to new sign-ups. Anyone already on a list keeps their price.</p>
            <Submit>Save</Submit>
          </ActionForm>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">{season ? "Start next season" : "Open the first season"}</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          {season
            ? "Closes this season. Its nights and payments are kept but hidden. Everyone starts over with no pass."
            : "Set the prices and where to send e-transfers."}
        </p>
        <ActionForm action={startSeason} className="flex flex-col gap-3"
          confirm={season ? `Close ${season.name} and start a new season?` : undefined}>
          <SeasonFields s={season ? { ...season, name: "" } : null} />
          <Submit variant={season ? "danger" : "primary"}>{season ? "Start new season" : "Open season"}</Submit>
        </ActionForm>
      </Card>

      {season && (
        <Card>
          <h2 className="font-semibold text-danger">Close season</h2>
          <p className="mb-3 mt-1 text-sm text-muted">
            Returns the site to &ldquo;no season&rdquo; until you open a new one. Nights and payments are kept but hidden.
          </p>
          <ActionForm action={closeSeason}
            confirm={`Close ${season.name}? The site will show "no season" until you open a new one.`}>
            <Submit variant="danger">Close season</Submit>
          </ActionForm>
        </Card>
      )}
    </>
  );
}
