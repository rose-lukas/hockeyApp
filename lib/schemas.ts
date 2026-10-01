import { z } from "zod";
import { STATUSES } from "./types";

export const name = z.string().trim().min(2, "Names are 2 to 40 characters.").max(40, "Names are 2 to 40 characters.");
export const id = z.uuid();
export const kind = z.enum(["season", "night"]);
export const status = z.enum(STATUSES as [string, ...string[]]);
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
export const time = z.string().regex(/^\d{2}:\d{2}$/, "Pick a time.");
export const shortText = (max: number) => z.string().trim().max(max).default("");

export const joinForm = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("season"), name }),
  z.object({ kind: z.literal("night"), name, nightId: id }),
]);

/** FormData → plain object, ignoring Next's internal `$ACTION_*` fields. */
export function fields(form: FormData) {
  return Object.fromEntries([...form.entries()].filter(([k]) => !k.startsWith("$")));
}
