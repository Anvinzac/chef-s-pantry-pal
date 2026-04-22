import { createContext, createElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toIsoDate } from '@/lib/purchaseCycle';

const STORAGE_KEY = 'chef-dismissals';

type DismissalMap = Record<string, string>;

function load(): DismissalMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

interface UseDismissalsValue {
  dismiss: (ingredientId: string) => void;
  isDismissedToday: (ingredientId: string) => boolean;
  reset: (ingredientId: string) => void;
}

const Ctx = createContext<UseDismissalsValue | undefined>(undefined);

export function DismissalsProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<DismissalMap>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }, [map]);

  const dismiss = useCallback((ingredientId: string) => {
    setMap(prev => ({ ...prev, [ingredientId]: toIsoDate(new Date()) }));
  }, []);

  const reset = useCallback((ingredientId: string) => {
    setMap(prev => {
      const next = { ...prev };
      delete next[ingredientId];
      return next;
    });
  }, []);

  const isDismissedToday = useCallback((ingredientId: string) => {
    const stored = map[ingredientId];
    if (!stored) return false;
    return stored === toIsoDate(new Date());
  }, [map]);

  const value = useMemo(() => ({
    dismiss,
    isDismissedToday,
    reset,
  }), [dismiss, isDismissedToday, reset]);

  return createElement(Ctx.Provider, { value }, children);
}

export function useDismissals() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDismissals must be used within DismissalsProvider');
  return ctx;
}
