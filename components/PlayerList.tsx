import type { ListRow } from "@/lib/types";
import { StatusPill } from "./StatusPill";

export function PlayerList({ rows }: { rows: ListRow[] }) {
  if (rows.length === 0) {
    return <p className="rounded-xl bg-sunken p-4 text-center text-muted">Nobody's on the list yet.</p>;
  }
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-surface">
      {rows.map((r) => (
        <li key={r.enrolment_id} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5">
          <span className="min-w-0 truncate">
            {r.name}
            {r.kind === "night" && <span className="ml-2 text-xs text-muted">1 night</span>}
          </span>
          <StatusPill status={r.status} />
        </li>
      ))}
    </ul>
  );
}
