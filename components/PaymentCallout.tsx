import { formatCents } from "@/lib/money";
import { CopyButton } from "./CopyButton";

export function PaymentCallout({
  email,
  note,
  amountCents,
  memo,
}: {
  email: string;
  note: string;
  amountCents?: number;
  memo?: string;
}) {
  if (!email) return null;
  return (
    <section className="rounded-xl bg-chrome-soft p-4" aria-labelledby="pay-heading">
      <h2 id="pay-heading" className="text-[13px] font-bold uppercase tracking-wider text-muted">
        How to pay
      </h2>
      <p className="mt-2 text-[15px]">
        Send {amountCents !== undefined ? <strong className="tabular-nums">{formatCents(amountCents)}</strong> : "your fee"} by
        e-transfer to
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="break-all font-display text-lg font-bold">{email}</span>
        <CopyButton value={email} />
      </div>
      {memo && (
        <p className="mt-2 text-[15px]">
          Put <strong>{memo}</strong> in the message.
        </p>
      )}
      {note && <p className="mt-2 whitespace-pre-line text-sm text-muted">{note}</p>}
      <p className="mt-2 text-xs text-muted">Cash works too — just hand it to Lukas Rose at the rink.</p>
    </section>
  );
}
