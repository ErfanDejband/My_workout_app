'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Plan, PlanExercise } from '@/lib/parser/schema';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

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
        <h2 className="font-display text-xl font-bold tracking-tight">
          {t('reviewTitle')}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('reviewIntro')}
        </p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          {t('summary')}
        </span>
        <Textarea
          value={plan.plan_meta.summary}
          onChange={(e) => updateSummary(e.target.value)}
          rows={2}
        />
      </label>

      <div className="space-y-4">
        {plan.week.map((day, di) => (
          <Card key={di} className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="w-10 shrink-0 text-sm font-bold text-neutral-500">
                {DAY_LABELS[day.day_index] ?? day.day_index}
              </span>
              <Input
                value={day.title}
                onChange={(e) => updateDayTitle(di, e.target.value)}
                className="flex-1 py-1.5 font-medium"
              />
              <Badge variant={day.type} className="shrink-0">
                {t(`types.${day.type}`)}
              </Badge>
            </div>

            {day.type === 'workout' ? (
              <div className="space-y-2 overflow-x-auto">
                <div className="min-w-[22rem] space-y-2">
                  <div className="hidden grid-cols-[1fr_3rem_4rem_4rem_2rem] gap-2 px-1 text-xs font-medium text-neutral-500 sm:grid">
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
                      <Input
                        value={ex.name}
                        onChange={(e) => updateExercise(di, ei, 'name', e.target.value)}
                        className="px-2 py-1"
                      />
                      <Input
                        value={ex.sets}
                        onChange={(e) => updateExercise(di, ei, 'sets', e.target.value)}
                        className="px-2 py-1"
                      />
                      <Input
                        value={ex.reps}
                        onChange={(e) => updateExercise(di, ei, 'reps', e.target.value)}
                        className="px-2 py-1"
                      />
                      <Input
                        value={ex.rest_sec}
                        onChange={(e) =>
                          updateExercise(di, ei, 'rest_sec', e.target.value)
                        }
                        className="px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeExercise(di, ei)}
                        aria-label={t('remove')}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg text-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'
                        )}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addExercise(di)}
                    className="px-1"
                  >
                    + {t('addExercise')}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="pl-10 text-sm text-neutral-500">{t('restDay')}</p>
            )}
          </Card>
        ))}
      </div>

      <Button
        onClick={() => onApprove(plan)}
        loading={saving}
        size="lg"
        className="w-full"
      >
        {saving ? t('saving') : t('approve')}
      </Button>
    </div>
  );
}
