const ZONE = "America/Toronto";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, weekday: "short", month: "short", day: "numeric" });
const longDayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, weekday: "long", month: "long", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, hour: "numeric", minute: "2-digit" });
const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
export const formatLongDay = (iso: string) => longDayFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** Toronto wall-clock parts for prefilling `<input type="date|time">`. */
export function toLocalInputs(iso: string) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** The next Saturday (or today, if it is Saturday) in Toronto, as YYYY-MM-DD. */
export function nextSaturday(from = new Date()) {
  const { date } = toLocalInputs(from.toISOString());
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}
