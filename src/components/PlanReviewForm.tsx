'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Plan, PlanExercise } from '@/lib/parser/schema';

const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function emptyExercise(): PlanExercise {
  return {
    name: '',
    canonical_id: '',
    primary_muscle: '',
    sets: 3,
    reps: '10',
    rest_sec: 60,
    how_to: '',
    notes: ''
  };
}

export default function PlanReviewForm({
  initial,
  saving,
  onApprove
}: {
  initial: Plan;
  saving: boolean;
  onApprove: (plan: Plan) => void;
}) {
  const t = useTranslations('plan');
  // Deep clone so edits don't mutate the parsed source.
  const [plan, setPlan] = useState<Plan>(() =>
    JSON.parse(JSON.stringify(initial))
  );

  function updateSummary(summary: string) {
    setPlan((p) => ({ ...p, plan_meta: { ...p.plan_meta, summary } }));
  }

  function updateDayTitle(di: number, title: string) {
    setPlan((p) => {
      const week = [...p.week];
      week[di] = { ...week[di], title };
      return { ...p, week };
    });
  }

  function updateExercise(
    di: number,
    ei: number,
    field: keyof PlanExercise,
    value: string
  ) {
    setPlan((p) => {
      const week = [...p.week];
      const exercises = [...week[di].exercises];
      const numeric = field === 'sets' || field === 'rest_sec';
      exercises[ei] = {
        ...exercises[ei],
        [field]: numeric ? Number(value) : value
      };
      week[di] = { ...week[di], exercises };
      return { ...p, week };
    });
  }

  function addExercise(di: number) {
    setPlan((p) => {
      const week = [...p.week];
      week[di] = { ...week[di], exercises: [...week[di].exercises, emptyExercise()] };
      return { ...p, week };
    });
  }

  function removeExercise(di: number, ei: number) {
    setPlan((p) => {
      const week = [...p.week];
      week[di] = {
        ...week[di],
        exercises: week[di].exercises.filter((_, i) => i !== ei)
      };
      return { ...p, week };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t('reviewTitle')}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('reviewIntro')}
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          {t('summary')}
        </span>
        <textarea
          value={plan.plan_meta.summary}
          onChange={(e) => updateSummary(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
      </label>

      <div className="space-y-4">
        {plan.week.map((day, di) => (
          <div
            key={di}
            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="w-10 shrink-0 text-sm font-semibold text-neutral-500">
                {DAY_LABELS[day.day_index] ?? day.day_index}
              </span>
              <input
                value={day.title}
                onChange={(e) => updateDayTitle(di, e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-1.5 text-sm font-medium dark:border-neutral-700"
              />
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {t(`types.${day.type}`)}
              </span>
            </div>

            {day.type === 'workout' ? (
              <div className="space-y-2">
                <div className="hidden grid-cols-[1fr_3rem_4rem_4rem_2rem] gap-2 px-1 text-xs text-neutral-500 sm:grid">
                  <span>{t('exercise')}</span>
                  <span>{t('sets')}</span>
                  <span>{t('reps')}</span>
                  <span>{t('rest')}</span>
                  <span />
                </div>
                {day.exercises.map((ex, ei) => (
                  <div
                    key={ei}
                    className="grid grid-cols-[1fr_3rem_4rem_4rem_2rem] items-center gap-2"
                  >
                    <input
                      value={ex.name}
                      onChange={(e) => updateExercise(di, ei, 'name', e.target.value)}
                      className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                    />
                    <input
                      value={ex.sets}
                      onChange={(e) => updateExercise(di, ei, 'sets', e.target.value)}
                      className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                    />
                    <input
                      value={ex.reps}
                      onChange={(e) => updateExercise(di, ei, 'reps', e.target.value)}
                      className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                    />
                    <input
                      value={ex.rest_sec}
                      onChange={(e) =>
                        updateExercise(di, ei, 'rest_sec', e.target.value)
                      }
                      className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(di, ei)}
                      aria-label={t('remove')}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addExercise(di)}
                  className="text-sm font-medium text-neutral-600 underline underline-offset-4 dark:text-neutral-400"
                >
                  + {t('addExercise')}
                </button>
              </div>
            ) : (
              <p className="pl-10 text-sm text-neutral-500">{t('restDay')}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => onApprove(plan)}
        disabled={saving}
        className="w-full rounded-lg bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {saving ? t('saving') : t('approve')}
      </button>
    </div>
  );
}
