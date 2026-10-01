const dollars = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export function formatCents(cents: number) {
  return dollars.format(cents / 100);
}

export function parseDollarsToCents(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, frac = ""] = clean.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}
