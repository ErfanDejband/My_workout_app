import { z } from 'zod';

// Mirrors the engineered-prompt JSON contract in docs/Project/concept.md §7.1.
// Keys are always English regardless of UI locale.

export const exerciseSchema = z.object({
  name: z.string(),
  canonical_id: z.string(),
  primary_muscle: z.string().default(''),
  sets: z.number().int().nonnegative().default(0),
  reps: z.string().default(''),
  rest_sec: z.number().int().nonnegative().default(0),
  how_to: z.string().default(''),
  notes: z.string().default('')
});

export const timedItemSchema = z.object({
  name: z.string(),
  duration_min: z.number().nonnegative().default(0)
});

export const daySchema = z.object({
  day_index: z.number().int().min(1).max(7),
  title: z.string(),
  type: z.enum(['workout', 'rest', 'active_recovery']),
  focus: z.array(z.string()).default([]),
  estimated_minutes: z.number().nonnegative().default(0),
  warmup: z.array(timedItemSchema).default([]),
  exercises: z.array(exerciseSchema).default([]),
  finisher: z.array(timedItemSchema).default([])
});

export const nutritionSchema = z
  .object({
    calorie_guidance: z.string().default(''),
    protein_g_per_day: z.string().default(''),
    notes: z.string().default('')
  })
  .partial();

export const planSchema = z.object({
  plan_meta: z.object({
    goal: z.string().default(''),
    days_per_week: z.number().int().nonnegative().default(0),
    session_minutes: z.number().int().nonnegative().default(0),
    split_type: z.string().default(''),
    summary: z.string().default('')
  }),
  week: z.array(daySchema),
  nutrition: nutritionSchema.optional(),
  progression: z.string().default('')
});

export type Plan = z.infer<typeof planSchema>;
export type PlanDay = z.infer<typeof daySchema>;
export type PlanExercise = z.infer<typeof exerciseSchema>;
