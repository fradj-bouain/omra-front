/** Helpers for Material datepicker (Date) ↔ API ISO date strings (yyyy-MM-dd). */

export function parseIsoDateString(s: string | null | undefined): Date | null {
  if (s == null || typeof s !== 'string') return null;
  const t = s.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function toIsoDateString(d: Date | null | undefined): string | undefined {
  if (d == null || !(d instanceof Date) || Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Build value for APIs expecting `datetime-local` style strings (yyyy-MM-ddTHH:mm). */
export function combineDateAndTime(
  date: Date | null | undefined,
  timeHHmm: string | null | undefined
): string | undefined {
  if (date == null || !(date instanceof Date) || Number.isNaN(date.getTime())) return undefined;
  const t = (timeHHmm ?? '').trim() || '00:00';
  const parts = t.split(':');
  const h = Math.min(23, Math.max(0, Number(parts[0]) || 0));
  const min = Math.min(59, Math.max(0, Number(parts[1]) || 0));
  const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}`;
}

export function parseDateTimeLocal(s: string | null | undefined): { date: Date | null; time: string } {
  if (s == null || typeof s !== 'string') return { date: null, time: '' };
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(s.trim());
  if (!m) return { date: null, time: '' };
  return { date: parseIsoDateString(m[1]), time: m[2] };
}
