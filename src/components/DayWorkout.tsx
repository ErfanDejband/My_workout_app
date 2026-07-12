'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import ExerciseDetail from '@/components/ExerciseDetail';
import AppShell from '@/components/ui/AppShell';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Checkbox from '@/components/ui/Checkbox';
import { cn } from '@/lib/cn';
import {
  completionKey,
  dateFromIso,
  dayIndexFromDate,
  getActivePlan,
  getCompletionsForDates,
  getTrialCompletions,
  getTrialPlan,
  setTrialCompletions,
  type PlanDayRow,
  type PlanExerciseRow
} from '@/lib/plans/queries';

type Props = {
  /** Route param `date` = `YYYY-MM-DD`. */
  date: string;
  /** Force trial (localStorage) data source. Also auto-detected from `?trial=1`. */
  trial?: boolean;
};

type State =
  | { status: 'loading' }
  | { status: 'noPlan' }
  | { status: 'rest'; day: PlanDayRow }
  | { status: 'noExercises'; day: PlanDayRow }
  | { status: 'ready'; day: PlanDayRow; exercises: PlanExerciseRow[] };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// Page chrome (back link + max-width shell) shared by every state. Hoisted to
// module scope so it isn't re-created on each render of DayWorkout.
function DayShell({
  backLabel,
  children
}: {
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <AppShell size="md">
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-brand"
        >
          ← {backLabel}
        </Link>
        {children}
      </div>
    </AppShell>
  );
}

export default function DayWorkout({ date, trial = false }: Props) {
  const t = useTranslations('day');
  const tTypes = useTranslations('plan.types');
  const format = useFormatter();

  const [state, setState] = useState<State>({ status: 'loading' });
  const [isTrial, setIsTrial] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const heading = useMemo(() => {
    if (!ISO_RE.test(date)) return date;
    return format.dateTime(dateFromIso(date), {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }, [date, format]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!ISO_RE.test(date)) {
        if (active) setState({ status: 'noPlan' });
        return;
      }

      const trialMode =
        trial ||
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('trial') === '1');
      if (active) setIsTrial(trialMode);

      const dayIndex = dayIndexFromDate(dateFromIso(date));

      // Resolve the projected plan (uniform shape for both sources).
      const plan = trialMode ? getTrialPlan() : await getActivePlan();
      if (!active) return;
      if (!plan) {
        setState({ status: 'noPlan' });
        return;
      }

      const day = plan.days.find((d) => d.day_index === dayIndex);
      if (!day) {
        setState({ status: 'noPlan' });
        return;
      }

      const exercises = plan.exercisesByDayId[day.id] ?? [];

      if (day.type !== 'workout') {
        setState({ status: 'rest', day });
        return;
      }
      if (!exercises.length) {
        setState({ status: 'noExercises', day });
        return;
      }

      // Seed initial checked state (survives refresh).
      const completions = trialMode
        ? getTrialCompletions()
        : await getCompletionsForDates([date]);
      if (!active) return;

      const done = new Set<string>();
      for (const ex of exercises) {
        if (completions[completionKey(ex.id, date)]) done.add(ex.id);
      }
      setChecked(done);
      setState({ status: 'ready', day, exercises });
    }

    load();
    return () => {
      active = false;
    };
  }, [date, trial]);

  function applyLocal(exId: string, value: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (value) next.add(exId);
      else next.delete(exId);
      return next;
    });
  }

  async function toggle(ex: PlanExerciseRow) {
    const value = !checked.has(ex.id);
    applyLocal(ex.id, value); // optimistic

    try {
      if (isTrial) {
        const map = getTrialCompletions();
        const key = completionKey(ex.id, date);
        if (value) map[key] = true;
        else delete map[key];
        setTrialCompletions(map);
        return;
      }

      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('no session');

      if (value) {
        const { error } = await supabase.from('completions').upsert(
          {
            user_id: user.id,
            plan_exercise_id: ex.id,
            date,
            done: true
          },
          { onConflict: 'plan_exercise_id,date' }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('completions')
          .delete()
          .eq('user_id', user.id)
          .eq('plan_exercise_id', ex.id)
          .eq('date', date);
        if (error) throw error;
      }
    } catch {
      applyLocal(ex.id, !value); // revert on failure
    }
  }

  const backLabel = t('backToDashboard');

  if (state.status === 'loading') {
    return (
      <DayShell backLabel={backLabel}>
        <p className="text-neutral-500">{t('loading')}</p>
      </DayShell>
    );
  }

  if (
    state.status === 'noPlan' ||
    state.status === 'rest' ||
    state.status === 'noExercises'
  ) {
    const message =
      state.status === 'noPlan'
        ? t('emptyNoPlan')
        : state.status === 'rest'
          ? t('emptyRest')
          : t('emptyNoExercises');
    const title = state.status === 'noPlan' ? undefined : state.day.title;

    return (
      <DayShell backLabel={backLabel}>
        <header>
          <p className="text-sm text-neutral-500">{heading}</p>
          {title && (
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          )}
        </header>
        <Card className="text-neutral-500">{message}</Card>
      </DayShell>
    );
  }

  const { day, exercises } = state;
  const total = exercises.length;
  const done = exercises.reduce((n, ex) => (checked.has(ex.id) ? n + 1 : n), 0);

  return (
    <DayShell backLabel={backLabel}>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">{heading}</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">{day.title}</h1>
          </div>
          <Badge variant={day.type}>{tTypes(day.type)}</Badge>
        </div>

        <div className="space-y-1.5">
          <ProgressBar done={done} total={total} />
          <p className="text-xs font-medium tabular-nums text-neutral-500">
            {t('progress', { done, total })}
          </p>
        </div>
      </header>

      <ul className="space-y-3">
        {exercises.map((ex) => {
          const isDone = checked.has(ex.id);
          const isOpen = expandedId === ex.id;
          return (
            <li
              key={ex.id}
              className={cn(
                'overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors dark:bg-neutral-900',
                isDone
                  ? 'border-lime-300 dark:border-lime-900/60'
                  : 'border-neutral-200 dark:border-neutral-800'
              )}
            >
              <div className="flex items-center gap-2 p-3 pr-4">
                <Checkbox
                  checked={isDone}
                  onChange={() => toggle(ex)}
                  label={t('markDone')}
                />
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : ex.id)}
                  aria-expanded={isOpen}
                  className="min-w-0 flex-1 text-left"
                >
                  <div
                    className={cn(
                      'truncate font-medium',
                      isDone && 'text-neutral-400 line-through dark:text-neutral-500'
                    )}
                  >
                    {ex.name}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {t('setsReps', { sets: ex.sets, reps: ex.reps })}
                    {ex.rest_sec > 0 && <> · {t('rest', { sec: ex.rest_sec })}</>}
                  </div>
                </button>
              </div>

              {/* Clicking the exercise (not the checkbox) expands the detail.
                  ExerciseDetail owns the AI-003 image seam. */}
              {isOpen && <ExerciseDetail exercise={ex} />}
            </li>
          );
        })}
      </ul>
    </DayShell>
  );
}
