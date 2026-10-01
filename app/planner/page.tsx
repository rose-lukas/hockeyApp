import { Planner } from "./Planner";

// Quarantined (AD-13): no links point here, no DB access, imports nothing from lib/ or components/.
export const metadata = { title: "Season planner", robots: { index: false, follow: false } };

export default function PlannerPage() {
  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-2xl font-extrabold">Season planner</h1>
      <Planner />
    </main>
  );
}
