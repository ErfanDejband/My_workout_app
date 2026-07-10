import { EXERCISE_ALIASES } from './aliases';

// Resolve a plan exercise to a free-exercise-db entry id.
// Strategy (docs/Project/src/structure.md §7): exact/normalized name, then alias
// table, else null. The exercise-library agent wires in the dataset snapshot and
// builds a real lookup; this is the interface + normalization scaffold.

export const IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function matchExercise(
  nameOrCanonicalId: string,
  lookupByName: Map<string, string> = new Map()
): string | null {
  const norm = normalizeName(nameOrCanonicalId);
  if (lookupByName.has(norm)) return lookupByName.get(norm)!;
  if (EXERCISE_ALIASES[norm]) return EXERCISE_ALIASES[norm];
  return null;
}
