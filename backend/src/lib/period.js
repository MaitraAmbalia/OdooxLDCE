import { z } from 'zod';

// Budget periods look like "2026-ODD" (Jul-Dec 2026) or "2026-EVEN" (Jan-Jun 2026).
// Boundaries are midnight IST (+05:30) because that is the club's timezone.
const PERIOD = /^(\d{4})-(ODD|EVEN)$/;

export const periodSchema = z.string().regex(PERIOD, 'period must look like 2026-ODD or 2026-EVEN');

// Returns the half-open window [start, end) as Dates, or null for a malformed period.
export function parsePeriod(period) {
  const m = PERIOD.exec(period);
  if (!m) return null;
  const year = Number(m[1]);
  const at = (y, month) => new Date(`${y}-${String(month).padStart(2, '0')}-01T00:00:00+05:30`);
  return m[2] === 'ODD' ? { start: at(year, 7), end: at(year + 1, 1) } : { start: at(year, 1), end: at(year, 7) };
}
