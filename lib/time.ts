const ZONE = "America/Toronto";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, weekday: "short", month: "short", day: "numeric" });
const longDayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, weekday: "long", month: "long", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, hour: "numeric", minute: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, weekday: "long" });
const monthShortFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, month: "short" });
const monthLongFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, month: "long" });
const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function ordinal(day: number) {
  const rem = day % 10;
  const teen = day % 100;
  if (teen >= 11 && teen <= 13) return `${day}th`;
  if (rem === 1) return `${day}st`;
  if (rem === 2) return `${day}nd`;
  if (rem === 3) return `${day}rd`;
  return `${day}th`;
}

function formatClock(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(d);
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "10";
  const minutePart = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value;
  const hour = Number(hourPart) % 12 || 12;
  const suffix = dayPeriod?.toLowerCase() === "pm" ? "pm" : "am";
  return minutePart === "00" ? `${hour}${suffix}` : `${hour}:${minutePart}${suffix}`;
}

export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
export const formatLongDay = (iso: string) => longDayFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatWeekday = (iso: string) => weekdayFmt.format(new Date(iso));
export const formatNightHeader = (iso: string) => {
  const d = new Date(iso);
  const month = monthLongFmt.format(d);
  const day = ordinal(Number(new Intl.DateTimeFormat("en-US", { timeZone: ZONE, day: "numeric" }).format(d)));
  return `${month} ${day} @ ${formatClock(iso)}`;
};
export const formatScheduleLine = (iso: string) => {
  const d = new Date(iso);
  const month = monthShortFmt.format(d);
  const day = Number(new Intl.DateTimeFormat("en-US", { timeZone: ZONE, day: "numeric" }).format(d));
  return `${month} ${day} @ ${formatClock(iso)}`;
};

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
