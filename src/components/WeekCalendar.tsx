'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  completionKey,
  currentWeekDates,
  dateFromIso,
  getActivePlan,
  getCompletionsForDates,
  getTrialCompletions,
  getTrialPlan,
  isoDate,
  type CompletionMap,
  type PlanDayRow,
  type PlanExerciseRow,
  type ProjectedPlan
} from '@/lib/plans/queries';

type Props = {
  /** Force trial (localStorage) data source. Also auto-detected from `?trial=1`. */
  trial?: boolean;
};

type State =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; data: ProjectedPlan; completions: CompletionMap };

export default function WeekCalendar({ trial = false }: Props) {
  const t = useTranslations('calendar');
  const tTypes = useTranslations('plan.types');
  const format = useFormatter();

  // Compute the week once; the dates are stable for the lifetime of the view.
  const weekDates = useMemo(() => currentWeekDates(), []);
  const todayIso = useMemo(() => isoDate(new Date()), []);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    async function load() {
      const isTrial =
        trial ||
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('trial') === '1');

      if (isTrial) {
        const plan = getTrialPlan();
        if (!active) return;
        if (!plan) {
          setState({ status: 'empty' });
          return;
        }
        setState({
          status: 'ready',
          data: plan,
          completions: getTrialCompletions()
        });
        return;
      }

      const plan = await getActivePlan();
      if (!active) return;
      if (!plan) {
        setState({ status: 'empty' });
        return;
      }
      const completions = await getCompletionsForDates(weekDates);
      if (!active) return;
      setState({ status: 'ready', data: plan, completions });
    }

    load();
    return () => {
      active = false;
    };
  }, [trial, weekDates]);

  if (state.status === 'loading') {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {t('loading')}
      </section>
    );
  }

  if (state.status === 'empty') {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {t('empty')}
      </section>
    );
  }

  const { data, completions } = state;
  const daysByIndex = new Map<number, PlanDayRow>(
    data.days.map((d) => [d.day_index, d])
  );

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-bold tracking-tight">{t('title')}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {weekDates.map((date, i) => {
          const dayIndex = i + 1; // Monday=1 … Sunday=7
          const day = daysByIndex.get(dayIndex);
          const dateObj = dateFromIso(date);
          const weekday = format.dateTime(dateObj, { weekday: 'long' });
          const dayMonth = format.dateTime(dateObj, {
            month: 'short',
            day: 'numeric'
          });

          const isWorkout = day?.type === 'workout';
          const exercises: PlanExerciseRow[] = day
            ? (data.exercisesByDayId[day.id] ?? [])
            : [];
          const total = exercises.length;
          const done = exercises.reduce(
            (n, ex) => (completions[completionKey(ex.id, date)] ? n + 1 : n),
            0
          );

          return (
            <DayCard
              key={date}
              date={date}
              weekday={weekday}
              dayMonth={dayMonth}
              day={day}
              typeLabel={day ? tTypes(day.type) : undefined}
              isWorkout={isWorkout}
              isToday={date === todayIso}
              done={done}
              total={total}
            />
          );
        })}
      </div>
    </section>
  );
}

function DayCard({
  date,
  weekday,
  dayMonth,
  day,
  typeLabel,
  isWorkout,
  isToday,
  done,
  total
}: {
  date: string;
  weekday: string;
  dayMonth: string;
  day: PlanDayRow | undefined;
  typeLabel: string | undefined;
  isWorkout: boolean;
  isToday: boolean;
  done: number;
  total: number;
}) {
  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display font-bold tracking-tight">{weekday}</span>
        <span
          className={cn(
            'text-sm tabular-nums',
            isToday ? 'font-semibold text-brand' : 'text-neutral-500'
          )}
        >
          {dayMonth}
        </span>
      </div>
      <div className="mt-1 truncate text-sm text-neutral-700 dark:text-neutral-300">
        {day?.title ?? '—'}
      </div>

      {isWorkout && total > 0 && (
        <div className="mt-3 space-y-1.5">
          <ProgressBar done={done} total={total} />
          <span className="text-xs font-medium tabular-nums text-neutral-500">
            {done}/{total}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {typeLabel && day && <Badge variant={day.type}>{typeLabel}</Badge>}
      </div>
    </>
  );

  const base =
    'block rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-900';
  const toneToday = 'border-brand ring-2 ring-brand/30';
  const toneDefault = 'border-neutral-200 dark:border-neutral-800';

  if (isWorkout) {
    return (
      <Link
        href={`/day/${date}`}
        className={cn(
          base,
          isToday ? toneToday : toneDefault,
          'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'
        )}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn(base, isToday ? toneToday : toneDefault, 'opacity-70')}>
      {inner}
    </div>
  );
}
