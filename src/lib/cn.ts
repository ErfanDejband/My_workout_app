// Tiny classnames joiner (no external deps). Filters out falsy values so
// conditional classes stay readable at call sites.
export type ClassValue = string | false | null | undefined;

export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}
