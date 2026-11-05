import { FUSEAU } from "./config";

/** Décalage (ms) du fuseau par rapport à UTC à l'instant donné. */
function decalage(instant: number, fuseau: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: fuseau, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instant));
  const v = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second")) - instant;
}

/** « 2026-11-07T21:00 » à Montréal → instant ISO UTC. */
export function localVersIso(local: string, fuseau = FUSEAU): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Heure invalide : ${local}`);
  const naif = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let t = naif - decalage(naif, fuseau);
  t = naif - decalage(t, fuseau); // second passage pour les changements d'heure
  return new Date(t).toISOString();
}
