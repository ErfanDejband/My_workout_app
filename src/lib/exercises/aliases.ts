// Synonym table mapping common AI exercise names to free-exercise-db ids.
// The exercise-library agent extends this as mismatches are found.
// Keys are normalized (lowercase, spaces) names; values are dataset ids.
export const EXERCISE_ALIASES: Record<string, string> = {
  // 'barbell bench press': 'Barbell_Bench_Press_-_Medium_Grip',
  // 'romanian deadlift': 'Romanian_Deadlift',
};
