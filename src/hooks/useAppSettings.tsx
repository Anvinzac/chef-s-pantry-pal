import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

const EDIT_MODE_KEY = 'chef-edit-mode';

interface AppSettingsContextValue {
  editingEnabled: boolean;
  toggleEditing: (value?: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [editingEnabled, setEditingEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(EDIT_MODE_KEY) === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(EDIT_MODE_KEY, editingEnabled ? '1' : '0');
  }, [editingEnabled]);

  const toggleEditing = (value?: boolean) => {
    setEditingEnabled(prev => (typeof value === 'boolean' ? value : !prev));
  };

  const value = useMemo(() => ({ editingEnabled, toggleEditing }), [editingEnabled]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}
