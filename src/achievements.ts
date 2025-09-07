import type { BabyProfile, Diaper, Feeding, Growth, Sleep } from './types';
import { pacificDateKey } from './utils';

export type AchievementId =
  | 'first_feed'
  | 'first_diaper'
  | 'first_sleep_log'
  | 'first_growth_entry'
  | 'ten_feedings_day'
  | 'wet_target_today'
  | 'stool_goal_today'
  | 'streak_3_days'
  | 'streak_7_days';

export interface AchievementsContext {
  baby: BabyProfile | null;
  feedings: Feeding[]; // all-time
  diapers: Diaper[]; // all-time
  sleeps: Sleep[]; // all-time
  growth: Growth[]; // all-time
  now?: Date;
}

export interface AchievementDef {
  id: AchievementId;
  icon: string; // emoji
  title: string;
  description: string;
  reward: string;
  check: (ctx: AchievementsContext) => {
    unlocked: boolean;
    unlockedAt?: string; // ISO
    // Optional progress for objectives
    progress?: number;
    goal?: number;
    progressLabel?: string;
  };
}

export interface AchievementStatus {
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt?: string;
  claimed: boolean;
  progress?: number;
  goal?: number;
  progressLabel?: string;
}

type ClaimState = Partial<Record<AchievementId, { claimed: boolean; claimedAt?: string }>>;

const STORAGE_KEY = 'sb_achievements_v1';

export function loadClaims(): ClaimState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ClaimState;
    return parsed || {};
  } catch {
    return {};
  }
}

function saveClaims(state: ClaimState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function claimAchievement(id: AchievementId) {
  const state = loadClaims();
  state[id] = { claimed: true, claimedAt: new Date().toISOString() };
  saveClaims(state);
}

// Helpers
function groupByDay<T extends { datetime?: string; start?: string }>(rows: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const r of rows) {
    const iso = (r as any).datetime || (r as any).start;
    if (!iso) continue;
    const key = pacificDateKey(iso);
    (out[key] ||= []).push(r);
  }
  return out;
}

function firstIso<T extends { datetime?: string; start?: string }>(rows: T[]): string | undefined {
  const iso = rows
    .map(r => (r as any).datetime || (r as any).start)
    .filter(Boolean)
    .sort((a, b) => (a! < b! ? -1 : 1))[0];
  return iso;
}

// Evidence-informed diaper targets are in utils; mirror minimal logic here to avoid cycles
function wetTargetForDayOfLife(day: number) {
  if (day <= 0) return 1;
  if (day === 1) return 2;
  if (day === 2) return 3;
  if (day === 3) return 4;
  return 6;
}
function stoolGoalForDayOfLife(day: number) { return day >= 3 ? 3 : 1; }

function dayOfLife(baby: BabyProfile | null, now: Date){
  if (!baby) return 0;
  const todayKey = pacificDateKey(now);
  const birthKey = pacificDateKey(baby.birthIso);
  // Rough calendar day diff in Pacific
  const [ty, tm, td] = todayKey.split('-').map(n => parseInt(n, 10));
  const [by, bm, bd] = birthKey.split('-').map(n => parseInt(n, 10));
  const da = Date.UTC(ty, tm - 1, td) - Date.UTC(by, bm - 1, bd);
  return Math.round(da / (24 * 3600 * 1000));
}

export const DEFINITIONS: AchievementDef[] = [
  {
    id: 'first_feed',
    icon: '🍼',
    title: 'First Feeding Logged',
    description: 'Log your very first feeding.',
    reward: 'Pick tonight’s show 🍿',
    check: ({ feedings }) => ({
      unlocked: feedings.length > 0,
      unlockedAt: firstIso(feedings),
      progress: feedings.length > 0 ? 1 : 0,
      goal: 1,
      progressLabel: feedings.length > 0 ? 'Done' : '0/1',
    }),
  },
  {
    id: 'first_diaper',
    icon: '🧷',
    title: 'First Diaper Logged',
    description: 'Log the first diaper change.',
    reward: '5‑minute shoulder rub 💆‍♀️',
    check: ({ diapers }) => ({
      unlocked: diapers.length > 0,
      unlockedAt: firstIso(diapers),
      progress: diapers.length > 0 ? 1 : 0,
      goal: 1,
      progressLabel: diapers.length > 0 ? 'Done' : '0/1',
    }),
  },
  {
    id: 'first_sleep_log',
    icon: '😴',
    title: 'First Sleep Logged',
    description: 'Track a sleep session.',
    reward: 'Free nap pass 💤',
    check: ({ sleeps }) => ({
      unlocked: sleeps.length > 0,
      unlockedAt: firstIso(sleeps),
      progress: sleeps.length > 0 ? 1 : 0,
      goal: 1,
      progressLabel: sleeps.length > 0 ? 'Done' : '0/1',
    }),
  },
  {
    id: 'first_growth_entry',
    icon: '📈',
    title: 'Growth Started',
    description: 'Add your first weight/length entry.',
    reward: 'Fancy coffee ☕️',
    check: ({ growth }) => ({
      unlocked: growth.length > 0,
      unlockedAt: firstIso(growth),
      progress: growth.length > 0 ? 1 : 0,
      goal: 1,
      progressLabel: growth.length > 0 ? 'Done' : '0/1',
    }),
  },
  {
    id: 'ten_feedings_day',
    icon: '🏅',
    title: 'Feeding Marathon',
    description: 'Hit 10 feedings in one day.',
    reward: 'Dessert night of your choice 🍰',
    check: ({ feedings, now }) => {
      const byDay = groupByDay(feedings);
      const maxInDay = Math.max(0, ...Object.values(byDay).map(list => list.length));
      const today = pacificDateKey(now || new Date());
      const todayCount = (byDay[today]?.length || 0);
      const unlocked = maxInDay >= 10;
      let unlockedAt: string | undefined;
      if (unlocked) {
        const day = Object.keys(byDay).find(k => (byDay[k]?.length || 0) >= 10);
        unlockedAt = firstIso(byDay[day!]);
      }
      return {
        unlocked,
        unlockedAt,
        progress: Math.min(10, todayCount),
        goal: 10,
        progressLabel: `${todayCount}/10 today`,
      };
    },
  },
  {
    id: 'wet_target_today',
    icon: '💧',
    title: 'Hydration Check',
    description: 'Meet the wet diaper target today.',
    reward: 'Choose dinner tonight 🍽️',
    check: ({ diapers, baby, now }) => {
      const n = now || new Date();
      const today = pacificDateKey(n);
      const todayDiapers = diapers.filter(d => pacificDateKey(d.datetime) === today);
      const wet = todayDiapers.filter(d => d.type !== 'dirty').length;
      const dol = dayOfLife(baby, n);
      const goal = wetTargetForDayOfLife(dol);
      return {
        unlocked: wet >= goal && goal > 0,
        unlockedAt: todayDiapers.length > 0 ? firstIso(todayDiapers) : undefined,
        progress: Math.min(goal, wet),
        goal,
        progressLabel: `${wet}/${goal} today`,
      };
    },
  },
  {
    id: 'stool_goal_today',
    icon: '🌟',
    title: 'Diaper Duty Pro',
    description: 'Hit the daily stool goal.',
    reward: '10‑minute foot massage 🦶',
    check: ({ diapers, baby, now }) => {
      const n = now || new Date();
      const today = pacificDateKey(n);
      const todayDiapers = diapers.filter(d => pacificDateKey(d.datetime) === today);
      const stool = todayDiapers.filter(d => d.type !== 'wet').length;
      const dol = dayOfLife(baby, n);
      const goal = stoolGoalForDayOfLife(dol);
      return {
        unlocked: stool >= goal && goal > 0,
        unlockedAt: todayDiapers.length > 0 ? firstIso(todayDiapers) : undefined,
        progress: Math.min(goal, stool),
        goal,
        progressLabel: `${stool}/${goal} today`,
      };
    },
  },
  {
    id: 'streak_3_days',
    icon: '📆',
    title: '3‑Day Streak',
    description: 'Log something three days in a row.',
    reward: 'Sleep‑in morning 😌',
    check: ({ feedings, diapers, sleeps, now }) => {
      const n = now || new Date();
      const days = new Set<string>();
      [feedings, diapers, sleeps].forEach(list => list.forEach((r: any) => days.add(pacificDateKey(r.datetime || r.start))));
      // Compute current consecutive streak ending today
      let streak = 0;
      const d = new Date(n);
      for (let i = 0; i < 120; i++) {
        const key = pacificDateKey(d);
        if (days.has(key)) streak++; else break;
        d.setDate(d.getDate() - 1);
      }
      return {
        unlocked: streak >= 3,
        progress: Math.min(3, streak),
        goal: 3,
        progressLabel: `Current streak: ${streak}/3 days`,
      };
    },
  },
  {
    id: 'streak_7_days',
    icon: '🔥',
    title: '7‑Day Streak',
    description: 'Keep logging for a full week.',
    reward: 'Dessert + show combo 🎬',
    check: ({ feedings, diapers, sleeps, now }) => {
      const n = now || new Date();
      const days = new Set<string>();
      [feedings, diapers, sleeps].forEach(list => list.forEach((r: any) => days.add(pacificDateKey(r.datetime || r.start))));
      let streak = 0;
      const d = new Date(n);
      for (let i = 0; i < 180; i++) {
        const key = pacificDateKey(d);
        if (days.has(key)) streak++; else break;
        d.setDate(d.getDate() - 1);
      }
      return {
        unlocked: streak >= 7,
        progress: Math.min(7, streak),
        goal: 7,
        progressLabel: `Current streak: ${streak}/7 days`,
      };
    },
  },
];

export function computeAchievements(ctx: AchievementsContext): AchievementStatus[] {
  const claims = loadClaims();
  const now = ctx.now || new Date();
  const enriched = DEFINITIONS.map(def => {
    const res = def.check({ ...ctx, now });
    const claim = claims[def.id];
    return {
      def,
      unlocked: !!res.unlocked,
      unlockedAt: res.unlockedAt,
      claimed: !!claim?.claimed,
      progress: res.progress,
      goal: res.goal,
      progressLabel: res.progressLabel,
    } as AchievementStatus;
  });
  return enriched;
}
