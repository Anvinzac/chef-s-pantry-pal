import { createContext, createElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { WeightOverrides } from '@/lib/purchaseCycle';

const STORAGE_KEY = 'chef-day-weights';

function load(): WeightOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

interface UseDayWeightsValue {
  overrides: WeightOverrides;
  setWeight: (isoDate: string, categoryId: string, weight: number) => void;
  clearWeight: (isoDate: string, categoryId: string) => void;
  setWeightForAllCategories: (isoDate: string, weight: number) => void;
  clearDate: (isoDate: string) => void;
}

const Ctx = createContext<UseDayWeightsValue | undefined>(undefined);

export function DayWeightsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<WeightOverrides>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const setWeight = useCallback((isoDate: string, categoryId: string, weight: number) => {
    setOverrides(prev => ({
      ...prev,
      [isoDate]: { ...(prev[isoDate] ?? {}), [categoryId]: weight },
    }));
  }, []);

  const clearWeight = useCallback((isoDate: string, categoryId: string) => {
    setOverrides(prev => {
      const dayMap = { ...(prev[isoDate] ?? {}) };
      delete dayMap[categoryId];
      const next = { ...prev };
      if (Object.keys(dayMap).length === 0) delete next[isoDate];
      else next[isoDate] = dayMap;
      return next;
    });
  }, []);

  const setWeightForAllCategories = useCallback((isoDate: string, weight: number) => {
    setOverrides(prev => ({ ...prev, [isoDate]: { __all: weight } }));
  }, []);

  const clearDate = useCallback((isoDate: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[isoDate];
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    overrides,
    setWeight,
    clearWeight,
    setWeightForAllCategories,
    clearDate,
  }), [overrides, setWeight, clearWeight, setWeightForAllCategories, clearDate]);

  return createElement(Ctx.Provider, { value }, children);
}

export function useDayWeights() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDayWeights must be used within DayWeightsProvider');
  return ctx;
}

export function resolveWeight(
  overrides: WeightOverrides,
  isoDate: string,
  categoryId: string,
  fallback: number
): number {
  const day = overrides[isoDate];
  if (!day) return fallback;
  if (typeof day[categoryId] === 'number') return day[categoryId];
  if (typeof day.__all === 'number') return day.__all;
  return fallback;
}
