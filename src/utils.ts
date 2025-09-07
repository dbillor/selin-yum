
import { differenceInCalendarDays, format, formatDistanceStrict, parseISO } from 'date-fns';

export function prettyDateTime(iso: string) {
  try { return format(parseISO(iso), 'PPpp'); } catch { return iso; }
}
export function prettyDate(iso: string) {
  try { return format(parseISO(iso), 'PP'); } catch { return iso; }
}

export function ageFromBirth(birthIso: string, nowIso?: string) {
  const now = nowIso ? new Date(nowIso) : new Date();
  const birth = new Date(birthIso);
  const days = differenceInCalendarDays(now, birth);
  const distance = formatDistanceStrict(now, birth, { unit: days < 1 ? 'hour' : 'day' });
  return { days, label: distance };
}

/** Evidence-informed diaper targets (min wet per 24h) */
export function wetDiaperTarget(dayOfLife: number) {
  if (dayOfLife <= 0) return 1;
  if (dayOfLife === 1) return 2;
  if (dayOfLife === 2) return 3;
  if (dayOfLife === 3) return 4;
  if (dayOfLife >= 4) return 6;
  return 6;
}

/** Evidence-informed stool guidance by day 4+ expect >=3-4 stools */
export function stoolTarget(dayOfLife: number) {
  return dayOfLife >= 3 ? 3 : 1;
}

export function mlToOz(ml?: number) {
  if (!ml && ml !== 0) return undefined;
  return +(ml / 29.5735).toFixed(1);
}
export function ozToMl(oz?: number) {
  if (!oz && oz !== 0) return undefined;
  return +(oz * 29.5735).toFixed(0);
}
