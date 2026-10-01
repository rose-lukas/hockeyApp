import Link from "next/link";
import { logout, setAmount, setStatus } from "@/app/actions/admin";
import { formatCents } from "@/lib/money";
import { STATUSES, type Kind, type Status } from "@/lib/types";
import { ActionForm, Submit } from "./ActionForm";
import { STATUS_LABEL } from "./StatusPill";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/admin", label: "Pending" },
  { href: "/admin/nights", label: "Nights" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminBar({ season }: { season?: string }) {
  return (
    <header className="sticky top-0 z-10 bg-chrome text-action-text">
      <div className="mx-auto flex max-w-[560px] items-center justify-between px-4 pt-2">
        <span className="font-display text-[13px] font-extrabold uppercase tracking-wider">
          Admin{season && <span className="font-normal opacity-70"> · {season}</span>}
        </span>
        <div className="flex items-center">
          <Link href="/" className="min-h-11 px-2 py-3 text-sm opacity-85">View site</Link>
          <form action={logout}>
            <button className="min-h-11 px-2 text-sm opacity-85">Log out</button>
          </form>
          <ThemeToggle />
        </div>
      </div>
      <nav className="mx-auto flex max-w-[560px] gap-1 overflow-x-auto px-2 pb-1">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="min-h-11 shrink-0 rounded-lg px-3 py-3 text-sm font-semibold opacity-90 hover:bg-white/10">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function StatusButtons({ kind, id, current }: { kind: Kind; id: string; current: Status }) {
  return (
    <ActionForm action={setStatus}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Payment status">
        {STATUSES.map((s) => (
          <Submit key={s} variant="chip" name="status" value={s}
            className={s === current ? "border-accent bg-chrome-soft" : "text-muted"}>
            <span aria-current={s === current ? "true" : undefined}>{STATUS_LABEL[s]}</span>
          </Submit>
        ))}
      </div>
    </ActionForm>
  );
}

export function AmountEditor({ kind, id, cents }: { kind: Kind; id: string; cents: number }) {
  return (
    <details className="text-sm">
      <summary className="min-h-11 cursor-pointer py-3 text-muted">
        <span className="tabular-nums">{formatCents(cents)}</span> · change amount
      </summary>
      <ActionForm action={setAmount} className="flex items-start gap-2">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input name="amount" inputMode="decimal" defaultValue={(cents / 100).toFixed(2)} aria-label="Amount in dollars"
          className="min-h-11 w-28 rounded-lg border bg-surface px-3" />
        <Submit variant="secondary">Save</Submit>
      </ActionForm>
    </details>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-surface p-4 ${className}`}>{children}</div>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-2xl font-extrabold">{children}</h1>;
}
