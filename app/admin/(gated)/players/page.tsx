import { addSeasonPass, deletePlayer, deleteSeasonPass, mergePlayers, renamePlayer } from "@/app/actions/admin";
import { ActionForm, Submit } from "@/components/ActionForm";
import { AmountEditor, Card, H1, StatusButtons } from "@/components/Admin";
import { Field } from "@/components/Field";
import { getCurrentSeason, getPlayers, getSeasonPasses } from "@/lib/queries";

export default async function PlayersPage() {
  const season = await getCurrentSeason();
  const [passes, players] = await Promise.all([season ? getSeasonPasses(season.id) : [], getPlayers()]);

  return (
    <>
      <H1>Players</H1>

      {season && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">Season passes · {passes.length}</h2>
          <Card>
            <ActionForm action={addSeasonPass} className="flex items-end gap-2">
              <div className="flex-1"><Field label="Give someone a season pass" name="name" required minLength={2} maxLength={40} autoComplete="off" /></div>
              <Submit variant="secondary">Add</Submit>
            </ActionForm>
          </Card>
          {passes.map((p) => (
            <Card key={p.id}>
              <span className="font-semibold">{p.player.name}</span>
              <AmountEditor kind="season" id={p.id} cents={p.amount_cents} />
              <StatusButtons kind="season" id={p.id} current={p.status} />
              <ActionForm action={deleteSeasonPass} className="mt-2" confirm={`Take away ${p.player.name}'s season pass? They'll drop off every night.`}>
                <input type="hidden" name="id" value={p.id} />
                <Submit variant="danger">Remove season pass</Submit>
              </ActionForm>
            </Card>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">Everyone · {players.length}</h2>
        <p className="text-sm text-muted">
          Fix typos, or merge duplicates like &ldquo;Dave M&rdquo; into &ldquo;Dave Morrissey&rdquo;. Merging moves all their nights and passes onto the one you keep.
        </p>
        {players.map((pl) => (
          <details key={pl.id} className="rounded-xl border bg-surface">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold">{pl.name}</summary>
            <div className="flex flex-col gap-4 border-t p-4">
              <ActionForm action={renamePlayer} className="flex items-end gap-2">
                <input type="hidden" name="id" value={pl.id} />
                <div className="flex-1"><Field label="Rename" name="name" defaultValue={pl.name} required minLength={2} maxLength={40} /></div>
                <Submit variant="secondary">Save</Submit>
              </ActionForm>

              {players.length > 1 && (
                <ActionForm action={mergePlayers} className="flex items-end gap-2" confirm="Merge these two players? This can't be undone.">
                  <input type="hidden" name="keep" value={pl.id} />
                  <label className="block flex-1">
                    <span className="text-sm font-semibold">Merge a duplicate into {pl.name}</span>
                    <select name="drop" defaultValue="" className="mt-1 block min-h-11 w-full rounded-lg border bg-surface px-3">
                      <option value="" disabled>Pick the duplicate…</option>
                      {players.filter((o) => o.id !== pl.id).map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </label>
                  <Submit variant="secondary">Merge</Submit>
                </ActionForm>
              )}

              <ActionForm action={deletePlayer} confirm={`Delete ${pl.name} and everything they're on? Use this for junk names.`}>
                <input type="hidden" name="id" value={pl.id} />
                <Submit variant="danger">Delete player</Submit>
              </ActionForm>
            </div>
          </details>
        ))}
      </section>
    </>
  );
}
