// Metric <-> imperial helpers (docs/Project/src/structure.md §10).
// Storage is ALWAYS metric (kg, cm); conversion is display-only.

export type UnitSystem = 'metric' | 'imperial';

export const kgToLb = (kg: number): number => kg * 2.2046226218;
export const lbToKg = (lb: number): number => lb / 2.2046226218;

export const cmToInch = (cm: number): number => cm / 2.54;
export const inchToCm = (inch: number): number => inch * 2.54;

export function formatWeight(kg: number, system: UnitSystem): string {
  return system === 'imperial'
    ? `${Math.round(kgToLb(kg))} lb`
    : `${Math.round(kg)} kg`;
}

export function formatHeight(cm: number, system: UnitSystem): string {
  if (system === 'metric') return `${Math.round(cm)} cm`;
  const totalInches = Math.round(cmToInch(cm));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}
