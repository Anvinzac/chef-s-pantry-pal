const REFERENCE_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);
const SYNODIC_MONTH_DAYS = 29.530588853;

export function getMoonPhase(date: Date): number {
  const diffDays = (date.getTime() - REFERENCE_NEW_MOON_UTC) / (1000 * 60 * 60 * 24);
  const phase = ((diffDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  return phase / SYNODIC_MONTH_DAYS;
}

function daysFromPhaseTarget(phase: number, target: number): number {
  const raw = Math.abs(phase - target);
  const wrapped = Math.min(raw, 1 - raw);
  return wrapped * SYNODIC_MONTH_DAYS;
}

export function isNewMoon(date: Date, toleranceDays = 0.75): boolean {
  return daysFromPhaseTarget(getMoonPhase(date), 0) < toleranceDays;
}

export function isFullMoon(date: Date, toleranceDays = 0.75): boolean {
  return daysFromPhaseTarget(getMoonPhase(date), 0.5) < toleranceDays;
}

export type SpecialMoonPhase = 'new' | 'full' | null;

export function getMoonPhaseLabel(date: Date): SpecialMoonPhase {
  if (isNewMoon(date)) return 'new';
  if (isFullMoon(date)) return 'full';
  return null;
}
