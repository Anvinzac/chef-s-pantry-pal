import { isNewMoon, isFullMoon } from './moonPhase';

export const DEFAULT_WEEKDAY_WEIGHT = 1.0;
export const DEFAULT_WEEKEND_WEIGHT = 1.2;
export const DEFAULT_MOON_PHASE_WEIGHT = 1.8;

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getDefaultDayWeight(date: Date): number {
  if (isNewMoon(date) || isFullMoon(date)) return DEFAULT_MOON_PHASE_WEIGHT;
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return DEFAULT_WEEKEND_WEIGHT;
  return DEFAULT_WEEKDAY_WEIGHT;
}

export type WeightOverrides = Record<string, Record<string, number>>;

export function getWeightForDay(
  date: Date,
  categoryId: string,
  overrides: WeightOverrides
): number {
  const iso = toIsoDate(date);
  const day = overrides[iso];
  if (day) {
    if (typeof day[categoryId] === 'number') return day[categoryId];
    if (typeof day.__all === 'number') return day.__all;
  }
  return getDefaultDayWeight(date);
}

export function accumulateWeightedDays(
  fromDate: Date,
  toDate: Date,
  categoryId: string,
  overrides: WeightOverrides
): number {
  if (fromDate >= toDate) return 0;
  let total = 0;
  const iter = new Date(fromDate);
  iter.setHours(0, 0, 0, 0);
  iter.setDate(iter.getDate() + 1);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  while (iter <= end) {
    total += getWeightForDay(iter, categoryId, overrides);
    iter.setDate(iter.getDate() + 1);
  }
  return total;
}

export interface CycleInput {
  lastPurchaseDate: Date;
  orderFrequencyDays: number;
  categoryId: string;
  deliveryOffset: number;
  overrides: WeightOverrides;
  today?: Date;
}

export function computeRemainingCycle({
  lastPurchaseDate,
  orderFrequencyDays,
  categoryId,
  deliveryOffset,
  overrides,
  today = new Date(),
}: CycleInput): number {
  const elapsed = accumulateWeightedDays(lastPurchaseDate, today, categoryId, overrides);
  return orderFrequencyDays - elapsed - deliveryOffset;
}
