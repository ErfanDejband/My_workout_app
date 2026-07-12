'use client';

import { useTranslations } from 'next-intl';
import type { PlanExerciseRow } from '@/lib/plans/queries';

/**
 * Lightweight, prop-based exercise detail panel shown when a row is expanded in
 * the day view. Purely presentational: it renders text the day view already has
 * (`primary_muscle`, `how_to`, `notes`).
 *
 * SEAM for AI-003 (exercise-library): the exercise image/GIF popup belongs here.
 * The library agent can match media by `exercise.library_id` (matched
 * free-exercise-db id) or `exercise.canonical_id` and render it in the slot
 * marked below — no restructuring of this component or the day view required.
 * Do NOT fetch or bundle any media in this file (that is AI-003's scope).
 */
export default function ExerciseDetail({
  exercise
}: {
  exercise: PlanExerciseRow;
}) {
  const t = useTranslations('day');

  return (
    <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-950/40">
      {/* AI-003 image/GIF slot: render exercise media here (keyed by
          exercise.library_id / exercise.canonical_id). Intentionally empty. */}

      {exercise.primary_muscle && (
        <p>
          <span className="font-medium">{t('detailMuscle')}: </span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {exercise.primary_muscle}
          </span>
        </p>
      )}

      {exercise.how_to && (
        <p className="mt-2">
          <span className="font-medium">{t('detailHowTo')}: </span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {exercise.how_to}
          </span>
        </p>
      )}

      {exercise.notes && (
        <p className="mt-2">
          <span className="font-medium">{t('detailNotes')}: </span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {exercise.notes}
          </span>
        </p>
      )}
    </div>
  );
}
