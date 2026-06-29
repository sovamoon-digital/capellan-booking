// Best-time posting schedule for Capellán (Dominican Republic).
//
// DR has NO daylight saving — it is a fixed UTC-04:00 (AST) year round,
// so we can safely treat "-04:00" as a constant offset.
//
// Shop is closed Sundays (matches the availability seed), so we never
// suggest Sunday slots. Recommended slots reflect typical engagement
// peaks for a local auto-service audience: late morning, early afternoon,
// and early evening.

export const DR_OFFSET = '-04:00';
const DR_TZ = 'America/Santo_Domingo';

// Hours (DR local, 24h) we recommend posting.
const SLOT_HOURS = [11, 14, 19]; // 11:00 AM, 2:00 PM, 7:00 PM
// Days we post (0=Sun ... 6=Sat). Sunday excluded — shop closed.
const OPEN_DOW = [1, 2, 3, 4, 5, 6];

const pad = (n: number) => String(n).padStart(2, '0');

/** Break a Date into DR-local calendar parts. */
function drParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DR_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const wd: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { year: +get('year'), month: +get('month'), day: +get('day'), weekday: wd[get('weekday')] ?? 0 };
}

/** Build a UTC ISO string from DR-local calendar parts + hour. */
export function drLocalToUtcIso(year: number, month: number, day: number, hour: number, min = 0): string {
  return new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00${DR_OFFSET}`).toISOString();
}

/**
 * Convert a browser datetime-local value (e.g. "2026-07-02T14:30"), entered
 * by an admin physically in DR, into a UTC ISO string for storage.
 */
export function drDatetimeLocalToUtc(local: string): string {
  if (!local) return '';
  const withSecs = local.length === 16 ? `${local}:00` : local;
  return new Date(`${withSecs}${DR_OFFSET}`).toISOString();
}

/** Format a stored UTC ISO for display in DR local time. */
export function formatDrLocal(iso: string): string {
  return new Intl.DateTimeFormat('es-DO', {
    timeZone: DR_TZ,
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(iso));
}

/**
 * Returns the next `count` recommended posting slots as UTC ISO strings,
 * starting at least 10 minutes from now.
 */
export function nextBestSlots(count = 6, fromIso?: string): string[] {
  const now = fromIso ? new Date(fromIso) : new Date();
  const floor = now.getTime() + 10 * 60_000;
  const out: string[] = [];

  for (let dayOffset = 0; dayOffset < 21 && out.length < count; dayOffset++) {
    const base = new Date(now.getTime() + dayOffset * 86_400_000);
    const { year, month, day, weekday } = drParts(base);
    if (!OPEN_DOW.includes(weekday)) continue;
    for (const h of SLOT_HOURS) {
      const iso = drLocalToUtcIso(year, month, day, h);
      if (new Date(iso).getTime() > floor) {
        out.push(iso);
        if (out.length >= count) break;
      }
    }
  }
  return out;
}
