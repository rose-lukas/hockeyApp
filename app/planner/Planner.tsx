"use client";

import { useState } from "react";

const money = (cents: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
const toCents = (s: string) => Math.max(0, Math.round((Number(s.replace(/[$,]/g, "")) || 0) * 100));
// Round up to the cent so the pot never comes up short.
const share = (totalCents: number, people: number) => (people > 0 ? Math.ceil(totalCents / people) : 0);

export function Planner() {
  const [cost, setCost] = useState("255.38");
  const [players, setPlayers] = useState(15);
  const [games, setGames] = useState(11);
  const [pot, setPot] = useState("486");

  const costCents = toCents(cost);
  const total = costCents * games;
  const each = share(total, players);
  const chatText = `${games} games × ${money(costCents)} = ${money(total)} ÷ ${players} players = ${money(each)} each`;

  const potCents = toCents(pot);
  const extra = costCents > 0 ? Math.floor(potCents / costCents) : 0;
  const leftover = potCents - extra * costCents;
  const toNext = costCents - leftover;

  return (
    <>
      <section className="flex flex-col gap-4 rounded-xl border bg-surface p-4">
        <h2 className="font-semibold">Price per player</h2>
        <Num label="Cost per game ($)" value={cost} onChange={setCost} />
        <Stepper label="Full-season players" value={players} onChange={setPlayers} min={1} />
        <Stepper label="Games" value={games} onChange={setGames} min={1} />

        <div className="rounded-xl bg-chrome p-4 text-action-text">
          <p className="font-display text-4xl font-extrabold tabular-nums">{money(each)}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider opacity-80">Each, for the season</p>
          <p className="mt-2 text-sm opacity-75">{games} × {money(costCents)} = {money(total)} ÷ {players}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[games - 1, games, games + 1].filter((g) => g > 0).map((g) => (
            <button key={g} type="button" onClick={() => setGames(g)}
              className={`rounded-lg border p-2 text-center ${g === games ? "border-accent bg-chrome-soft" : ""}`}>
              <span className="block text-xs text-muted">{g} games</span>
              <span className="font-display font-bold tabular-nums">{money(share(costCents * g, players))}</span>
            </button>
          ))}
        </div>

        <Copy text={chatText} />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border bg-surface p-4">
        <h2 className="font-semibold">What does the pot buy?</h2>
        <Num label="Money in the pot ($)" value={pot} onChange={setPot} />
        <p className="font-display text-2xl font-bold">
          {extra} more {extra === 1 ? "game" : "games"}
        </p>
        <p className="text-sm text-muted">
          {money(leftover)} left over. {costCents > 0 && <>{money(toNext)} short of another · {money(share(toNext, players))} each from {players} players.</>}
        </p>
      </section>
    </>
  );
}

function Num({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 block min-h-11 w-full rounded-lg border bg-surface px-3" />
    </label>
  );
}

function Stepper({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">{label}</span>
      <span className="flex items-center gap-3">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} onClick={() => onChange(Math.max(min, value - 1))}
          className="size-11 rounded-lg border bg-sunken text-lg font-bold">−</button>
        <span className="w-8 text-center font-display text-xl font-extrabold tabular-nums" aria-live="polite">{value}</span>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} onClick={() => onChange(value + 1)}
          className="size-11 rounded-lg border bg-sunken text-lg font-bold">+</button>
      </span>
    </div>
  );
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <p className="rounded-lg border border-dashed bg-sunken p-3 text-sm">{text}</p>
      <button type="button"
        onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch {} }}
        className="min-h-12 rounded-xl bg-action font-display font-bold text-action-text">
        <span aria-live="polite">{done ? "Copied" : "Copy for group chat"}</span>
      </button>
    </>
  );
}
