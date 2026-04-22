import { createContext, createElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'chef-category-settings';

type CategorySettingsMap = Record<string, { deliveryOffset: number }>;

function load(): CategorySettingsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

interface UseCategorySettingsValue {
  settings: CategorySettingsMap;
  getDeliveryOffset: (categoryId: string) => number;
  setDeliveryOffset: (categoryId: string, offset: number) => void;
}

const Ctx = createContext<UseCategorySettingsValue | undefined>(undefined);

export function CategorySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CategorySettingsMap>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const getDeliveryOffset = useCallback((categoryId: string) => {
    return settings[categoryId]?.deliveryOffset ?? 0;
  }, [settings]);

  const setDeliveryOffset = useCallback((categoryId: string, offset: number) => {
    setSettings(prev => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] ?? {}), deliveryOffset: offset },
    }));
  }, []);

  const value = useMemo(() => ({
    settings,
    getDeliveryOffset,
    setDeliveryOffset,
  }), [settings, getDeliveryOffset, setDeliveryOffset]);

  return createElement(Ctx.Provider, { value }, children);
}

export function useCategorySettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCategorySettings must be used within CategorySettingsProvider');
  return ctx;
}
