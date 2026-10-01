"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { joinAction, type JoinState } from "@/app/actions/public";
import { PaymentCallout } from "@/components/PaymentCallout";
import { StatusPill } from "@/components/StatusPill";
import { formatCents } from "@/lib/money";
import { formatLongDay } from "@/lib/time";

type Props = {
  nights: { id: string; label: string }[];
  defaultNight?: string;
  seasonPriceCents: number;
  nightPriceCents: number;
};

export function JoinForm({ nights, defaultNight, seasonPriceCents, nightPriceCents }: Props) {
  const [state, action] = useActionState<JoinState, FormData>(joinAction, null);
  const [kind, setKind] = useState<"night" | "season">(nights.length ? "night" : "season");

  if (state?.ok) {
    const r = state.result;
    const alreadyPaid = r.status === "paid" || r.status === "waived";
    return (
      <div className="flex flex-col gap-6">
        <section className="rounded-[18px] bg-chrome p-5 text-action-text">
          <p className="font-display text-3xl font-extrabold">
            {r.created ? "You're on the list." : "You were already on the list."}
          </p>
          <p className="mt-2 text-[15px] opacity-85">
            {r.name} · {r.kind === "season" ? "Whole season" : r.faceoff_at ? formatLongDay(r.faceoff_at) : "One night"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <StatusPill status={r.status} />
            <span className="font-display text-lg font-bold tabular-nums">{formatCents(r.amount_cents)}</span>
          </div>
        </section>
        {!alreadyPaid && (
          <>
            <p>
              You&apos;ll show as <strong>pending</strong> until the organiser sees your e-transfer.
            </p>
            <PaymentCallout email={r.etransfer_email} note={r.payment_note} amountCents={r.amount_cents} memo={r.name} />
          </>
        )}
        <Link href="/" className="flex min-h-12 items-center justify-center rounded-xl border bg-surface font-semibold text-accent">
          Back to the list
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-extrabold">Get on the list</h1>

      <label className="block">
        <span className="font-semibold">Your name</span>
        <input
          name="name"
          required
          minLength={2}
          maxLength={40}
          autoComplete="name"
          placeholder="First and last"
          className="mt-1 block min-h-12 w-full rounded-xl border bg-surface px-4 text-fg placeholder:text-muted"
        />
        <span className="mt-1 block text-sm text-muted">Use the same name every time so your games line up.</span>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">What are you paying for?</legend>
        <Choice checked={kind === "night"} disabled={!nights.length} onSelect={() => setKind("night")}
          title="One night" price={formatCents(nightPriceCents)}
          detail={nights.length ? "Pick the night below." : "No upcoming nights are open."} value="night" />
        <Choice checked={kind === "season"} onSelect={() => setKind("season")}
          title="Whole season" price={formatCents(seasonPriceCents)} detail="On the list every night." value="season" />
      </fieldset>

      {kind === "night" && nights.length > 0 && (
        <label className="block">
          <span className="font-semibold">Which night?</span>
          <select
            name="nightId"
            defaultValue={nights.some((n) => n.id === defaultNight) ? defaultNight : nights[0].id}
            className="mt-1 block min-h-12 w-full rounded-xl border bg-surface px-3 text-fg"
          >
            {nights.map((n) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </label>
      )}

      {state && !state.ok && (
        <p role="alert" className="rounded-xl border border-danger p-3 text-danger">{state.message}</p>
      )}

      <JoinButton />
    </form>
  );
}

function Choice(props: {
  checked: boolean; disabled?: boolean; onSelect: () => void;
  title: string; price: string; detail: string; value: string;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-surface p-4 has-[:checked]:border-accent has-[:checked]:bg-chrome-soft ${props.disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input type="radio" name="kind" value={props.value} checked={props.checked} disabled={props.disabled}
        onChange={props.onSelect} className="size-5 accent-[var(--accent)]" />
      <span className="flex-1">
        <span className="block font-semibold">{props.title}</span>
        <span className="block text-sm text-muted">{props.detail}</span>
      </span>
      <span className="font-display text-lg font-bold tabular-nums">{props.price}</span>
    </label>
  );
}

function JoinButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="min-h-14 rounded-xl bg-action font-display text-lg font-bold text-action-text disabled:opacity-60">
      {pending ? "Adding you…" : "Add me — I'll send the e-transfer"}
    </button>
  );
}
