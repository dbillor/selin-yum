
import { differenceInCalendarDays } from 'date-fns';

// Centralized Pacific Time (PST/PDT) formatting
export const PACIFIC_TZ = 'America/Los_Angeles';

function dtf(opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, { timeZone: PACIFIC_TZ, ...opts });
}

export function prettyDateTime(iso: string) {
  try { return dtf({ dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); } catch { return iso; }
}
export function prettyDate(iso: string) {
  try { return dtf({ dateStyle: 'medium' }).format(new Date(iso)); } catch { return iso; }
}

export function formatDatePacific(d: Date) {
  return dtf({ dateStyle: 'medium' }).format(d);
}
export function formatDateTimePacific(d: Date) {
  return dtf({ dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

// Convert an instant to a `datetime-local` value string in Pacific time (YYYY-MM-DDTHH:mm)
export function toDatetimeLocalPacific(instant: Date | string) {
  const d = typeof instant === 'string' ? new Date(instant) : instant;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PACIFIC_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value || '1970';
  const m = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  const hh = parts.find(p => p.type === 'hour')?.value || '00';
  const mm = parts.find(p => p.type === 'minute')?.value || '00';
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// Interpret a `datetime-local` string as Pacific local time and return ISO (UTC)
export function fromDatetimeLocalPacific(local: string) {
  // Expect YYYY-MM-DDTHH:mm or seconds too; keep only YYYY-MM-DDTHH:mm
  const [datePart, timePartRaw] = local.split('T');
  const timePart = (timePartRaw || '00:00').slice(0,5);
  const [y, m, d] = datePart.split('-').map(n => parseInt(n, 10));
  const [hh, mm] = timePart.split(':').map(n => parseInt(n, 10));

  // Try both PDT (-420) and PST (-480) offsets — choose the one that renders back to the same local wall time
  const offsets = [-420, -480]; // minutes relative to UTC
  for (const off of offsets) {
    const t = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0) - off * 60 * 1000;
    const check = new Intl.DateTimeFormat('en-CA', {
      timeZone: PACIFIC_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date(t));
    const yy = parseInt(check.find(p => p.type === 'year')?.value || '0', 10);
    const mo = parseInt(check.find(p => p.type === 'month')?.value || '0', 10);
    const da = parseInt(check.find(p => p.type === 'day')?.value || '0', 10);
    const ho = parseInt(check.find(p => p.type === 'hour')?.value || '0', 10);
    const mi = parseInt(check.find(p => p.type === 'minute')?.value || '0', 10);
    if (yy === y && mo === m && da === d && ho === hh && mi === mm) return new Date(t).toISOString();
  }
  // Fallback: assume PST (-480)
  const fallback = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0) - (-480) * 60 * 1000;
  return new Date(fallback).toISOString();
}

// YYYY-MM-DD key for a Date when viewed in Pacific Time
export function pacificDateKey(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PACIFIC_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
  return parts; // en-CA gives YYYY-MM-DD
}

// Epoch (UTC) representing Pacific calendar day midnight for a given instant
function pacificDayEpoch(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d);
  const y = Number(parts.find(p => p.type === 'year')?.value || '1970');
  const m = Number(parts.find(p => p.type === 'month')?.value || '01');
  const day = Number(parts.find(p => p.type === 'day')?.value || '01');
  // Construct a UTC timestamp keyed to Pacific calendar day
  return Date.UTC(y, m - 1, day, 0, 0, 0, 0);
}

export function ageFromBirth(birthIso: string, nowIso?: string) {
  const now = nowIso ? new Date(nowIso) : new Date();
  const birth = new Date(birthIso);
  const days = Math.round((pacificDayEpoch(now) - pacificDayEpoch(birth)) / (24 * 3600 * 1000));
  if (days < 1) {
    const hours = Math.floor((now.getTime() - birth.getTime()) / (3600 * 1000));
    return { days, label: `${hours} hour${hours === 1 ? '' : 's'}` };
  }
  return { days, label: `${days} day${days === 1 ? '' : 's'}` };
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
