// Shared plan + completion queries used by the calendar (dashboard) and the
// day view. Everything here is safe to call from Client Components: the
// signed-in helpers use the browser Supabase client, and the trial helpers
// read the browser's localStorage.
//
// Data model recap (see docs/Project/src/structure.md §3 and
// docs/Project/Action_items/AI-002):
//   - A plan is a weekly TEMPLATE keyed by `day_index` (1=Mon … 7=Sun).
//   - Completion is tracked per REAL date (`YYYY-MM-DD`), keyed by
//     (plan_exercise, date).
//
// localStorage key conventions (so the day-view / workout-tracking agent
// matches them exactly):
//   - `trialPlan`         → `{ raw: string, parsed: Plan }` (written by AI-001).
//   - `trialCompletions`  → `CompletionMap`, a `{ [key]: true }` map where
//                            `key = completionKey(planExerciseKey, date)`.
//
// Per-exercise "key" convention (uniform across signed-in and trial):
//   - Signed-in: the `plan_exercises.id` UUID.
//   - Trial:     `${dayIndex}:${ord}` (synthesized, stable — trial plans have
//                no DB ids). The projected `PlanExerciseRow.id` already holds
//                this value, so the UI can always use `exercise.id`.
// The completion map key then joins that with the date: `${exerciseKey}|${date}`.

import { createClient } from '@/lib/supabase/client';
import type { Plan } from '@/lib/parser/schema';

// ---------------------------------------------------------------------------
// Row types (normalized DB projection). Kept in sync with structure.md §3.
// ---------------------------------------------------------------------------

export type DayType = 'workout' | 'rest' | 'active_recovery';

export interface PlanRow {
  id: string;
  user_id: string;
  source: string | null;
  raw_response: string | null;
  parsed: Plan | null;
  is_active: boolean;
  created_at: string;
}

export interface PlanDayRow {
  id: string;
  plan_id: string;
  user_id: string;
  day_index: number; // 1=Mon … 7=Sun
  title: string;
  type: DayType;
  focus: string[];
  estimated_minutes: number;
}

export interface PlanExerciseRow {
  id: string; // UUID (signed-in) or `${dayIndex}:${ord}` (trial)
  plan_day_id: string;
  user_id: string;
  ord: number;
  name: string;
  canonical_id: string;
  primary_muscle: string;
  sets: number;
  reps: string;
  rest_sec: number;
  how_to: string;
  notes: string;
  library_id: string | null;
}

export interface CompletionRow {
  id: string;
  user_id: string;
  plan_exercise_id: string;
  date: string; // YYYY-MM-DD
  done: boolean;
  done_at: string;
}

/** Uniform shape the UI consumes regardless of source. */
export interface ProjectedPlan {
  days: PlanDayRow[];
  exercisesByDayId: Record<string, PlanExerciseRow[]>;
}

export interface ActivePlan extends ProjectedPlan {
  plan: PlanRow;
}

export interface TrialPlan extends ProjectedPlan {
  parsed: Plan;
}

// ---------------------------------------------------------------------------
// Completion map: `{ [ "<exerciseKey>|<date>" ]: true }`.
// ---------------------------------------------------------------------------

export type CompletionMap = Record<string, true>;

export const TRIAL_PLAN_KEY = 'trialPlan';
export const TRIAL_COMPLETIONS_KEY = 'trialCompletions';

/** Build the CompletionMap key for a given exercise + date. */
export function completionKey(exerciseKey: string, date: string): string {
  return `${exerciseKey}|${date}`;
}

// ---------------------------------------------------------------------------
// Date helpers.
// ---------------------------------------------------------------------------

/** Format a Date to a local `YYYY-MM-DD` string (no timezone shift). */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a `YYYY-MM-DD` string into a local Date (avoids UTC parsing shift). */
export function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Weekday of a date as Mon=1 … Sun=7 (matches plan_days.day_index). */
export function dayIndexFromDate(d: Date): number {
  const g = d.getDay(); // 0=Sun … 6=Sat
  return g === 0 ? 7 : g;
}

/**
 * The 7 ISO dates (Monday → Sunday) of the week containing `ref`.
 * Index i (0..6) corresponds to day_index i+1.
 */
export function currentWeekDates(ref: Date = new Date()): string[] {
  const idx = dayIndexFromDate(ref); // 1..7
  const monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  monday.setDate(monday.getDate() - (idx - 1));
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push(isoDate(d));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Signed-in plan (Supabase browser client).
// ---------------------------------------------------------------------------

/**
 * Load the signed-in user's active plan with its normalized days + exercises.
 * Returns `null` when there is no session or no active plan.
 */
export async function getActivePlan(): Promise<ActivePlan | null> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!plan) return null;

  const { data: dayRows } = await supabase
    .from('plan_days')
    .select('*')
    .eq('plan_id', plan.id)
    .order('day_index', { ascending: true });

  const days = (dayRows ?? []) as PlanDayRow[];

  const exercisesByDayId: Record<string, PlanExerciseRow[]> = {};
  if (days.length) {
    const { data: exRows } = await supabase
      .from('plan_exercises')
      .select('*')
      .eq('user_id', user.id)
      .in(
        'plan_day_id',
        days.map((d) => d.id)
      )
      .order('ord', { ascending: true });

    for (const ex of (exRows ?? []) as PlanExerciseRow[]) {
      (exercisesByDayId[ex.plan_day_id] ??= []).push(ex);
    }
  }

  return { plan: plan as PlanRow, days, exercisesByDayId };
}

/**
 * Completion map for the signed-in user across the given dates.
 * Keyed by `completionKey(plan_exercise_id, date)`.
 */
export async function getCompletionsForDates(
  dates: string[]
): Promise<CompletionMap> {
  const map: CompletionMap = {};
  if (!dates.length) return map;

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return map;

  const { data } = await supabase
    .from('completions')
    .select('plan_exercise_id, date, done')
    .eq('user_id', user.id)
    .in('date', dates);

  for (const row of (data ?? []) as Pick<
    CompletionRow,
    'plan_exercise_id' | 'date' | 'done'
  >[]) {
    if (row.done) map[completionKey(row.plan_exercise_id, row.date)] = true;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Trial plan (localStorage).
// ---------------------------------------------------------------------------

/**
 * Project a parsed Zod `Plan` into the uniform `{ days, exercisesByDayId }`
 * shape. Trial plans have no DB ids, so ids are synthesized:
 *   - day id:      `day-${day_index}`
 *   - exercise id: `${day_index}:${ord}` (the per-exercise completion key)
 */
export function projectParsedPlan(parsed: Plan): ProjectedPlan {
  const days: PlanDayRow[] = parsed.week
    .map((d) => ({
      id: `day-${d.day_index}`,
      plan_id: 'trial',
      user_id: 'trial',
      day_index: d.day_index,
      title: d.title,
      type: d.type,
      focus: d.focus,
      estimated_minutes: d.estimated_minutes
    }))
    .sort((a, b) => a.day_index - b.day_index);

  const exercisesByDayId: Record<string, PlanExerciseRow[]> = {};
  for (const d of parsed.week) {
    const dayId = `day-${d.day_index}`;
    exercisesByDayId[dayId] = d.exercises.map((ex, i) => ({
      id: `${d.day_index}:${i}`,
      plan_day_id: dayId,
      user_id: 'trial',
      ord: i,
      name: ex.name,
      canonical_id: ex.canonical_id,
      primary_muscle: ex.primary_muscle,
      sets: ex.sets,
      reps: ex.reps,
      rest_sec: ex.rest_sec,
      how_to: ex.how_to,
      notes: ex.notes,
      library_id: null
    }));
  }

  return { days, exercisesByDayId };
}

/** Load the trial plan from localStorage, projected to the uniform shape. */
export function getTrialPlan(): TrialPlan | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(TRIAL_PLAN_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as { raw?: string; parsed?: Plan };
    if (!stored.parsed) return null;
    return { parsed: stored.parsed, ...projectParsedPlan(stored.parsed) };
  } catch {
    return null;
  }
}

/** Read the trial completion map from localStorage. */
export function getTrialCompletions(): CompletionMap {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(TRIAL_COMPLETIONS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CompletionMap;
  } catch {
    return {};
  }
}

/** Persist the trial completion map to localStorage. */
export function setTrialCompletions(map: CompletionMap): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TRIAL_COMPLETIONS_KEY, JSON.stringify(map));
}
