import Link from "next/link";
import { notFound } from "next/navigation";
import { addToNight, deleteNight, removeFromNight, restoreToNight, saveNight, setNightBookingStatus, setNightStatus } from "@/app/actions/admin";
import { ActionForm, Submit } from "@/components/ActionForm";
import { AmountEditor, Card, H1, StatusButtons } from "@/components/Admin";
import { Field } from "@/components/Field";
import { BookingBadge } from "@/components/StatusPill";
import { getAbsences, getNight, getNightList } from "@/lib/queries";
import { formatLongDay, formatTime, toLocalInputs } from "@/lib/time";

export default async function AdminNightPage({ params }: PageProps<"/admin/nights/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const night = await getNight(id);
  if (!night) notFound();
  const [list, absent] = await Promise.all([getNightList(id), getAbsences(id)]);
  const local = toLocalInputs(night.faceoff_at);
  const cancelled = night.status === "cancelled";

  return (
    <>
      <Link href="/admin/nights" className="-mb-3 min-h-11 self-start py-2 text-sm font-semibold text-accent">← Nights</Link>
      <div>
        <div className="flex items-center gap-2">
          <H1>{formatLongDay(night.faceoff_at)}</H1>
          <BookingBadge status={night.booking_status} />
        </div>
        <p className="text-muted">
          {formatTime(night.faceoff_at)}{night.arena && ` · ${night.arena}`} · {night.headcount} on the list · {night.paid_count} paid
          {cancelled && " · Cancelled"}
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Add someone</h2>
        <ActionForm action={addToNight} className="flex items-end gap-2">
          <input type="hidden" name="nightId" value={night.id} />
          <div className="flex-1"><Field label="Name" name="name" required minLength={2} maxLength={40} autoComplete="off" /></div>
          <Submit variant="secondary">Add</Submit>
        </ActionForm>
        <p className="mt-2 text-xs text-muted">Works after faceoff too. Adding a removed season-pass holder puts them back.</p>
      </Card>

      <section>
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-muted">On the list · {list.length}</h2>
        <ul className="flex flex-col gap-3">
          {list.length === 0 && <li className="rounded-xl bg-sunken p-4 text-muted">Nobody yet.</li>}
          {list.map((r) => (
            <li key={r.enrolment_id}>
              <Card>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-sm text-muted">{r.kind === "season" ? "Season pass" : "This night"}</span>
                </div>
                <AmountEditor kind={r.kind} id={r.enrolment_id} cents={r.amount_cents} />
                <StatusButtons kind={r.kind} id={r.enrolment_id} current={r.status} />
                <ActionForm action={removeFromNight} className="mt-2"
                  confirm={r.kind === "night" ? `Remove ${r.name} and delete their charge for this night?` : undefined}>
                  <input type="hidden" name="nightId" value={night.id} />
                  <input type="hidden" name="playerId" value={r.player_id} />
                  <Submit variant="danger">Remove from this night</Submit>
                </ActionForm>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {absent.length > 0 && (
        <section>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-muted">Season passes removed from this night</h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-surface">
            {absent.map((a) => (
              <li key={a.player_id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span>{a.name}</span>
                <ActionForm action={restoreToNight}>
                  <input type="hidden" name="nightId" value={night.id} />
                  <input type="hidden" name="playerId" value={a.player_id} />
                  <Submit variant="secondary">Put back</Submit>
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Edit night</h2>
        <ActionForm action={saveNight} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={night.id} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" name="date" type="date" required defaultValue={local.date} />
            <Field label="Faceoff" name="time" type="time" required defaultValue={local.time} />
          </div>
          <Field label="Arena" name="arena" maxLength={80} defaultValue={night.arena} />
          <Field label="Note" name="note" maxLength={200} defaultValue={night.note} />
          <Submit variant="secondary">Save changes</Submit>
        </ActionForm>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <ActionForm action={setNightBookingStatus}>
            <input type="hidden" name="id" value={night.id} />
            <input type="hidden" name="status" value={night.booking_status === "booked" ? "planned" : "booked"} />
            <Submit variant="secondary">{night.booking_status === "booked" ? "Mark as planned" : "Mark as booked"}</Submit>
          </ActionForm>
          <ActionForm action={setNightStatus} confirm={cancelled ? undefined : "Cancel this night? It stays on the schedule, marked cancelled."}>
            <input type="hidden" name="id" value={night.id} />
            <input type="hidden" name="status" value={cancelled ? "scheduled" : "cancelled"} />
            <Submit variant={cancelled ? "secondary" : "danger"}>{cancelled ? "Un-cancel night" : "Cancel night"}</Submit>
          </ActionForm>
          <ActionForm action={deleteNight} confirm="Delete this night completely? Only possible if nobody signed up for it.">
            <input type="hidden" name="id" value={night.id} />
            <Submit variant="danger">Delete</Submit>
          </ActionForm>
        </div>
      </Card>
    </>
  );
}
