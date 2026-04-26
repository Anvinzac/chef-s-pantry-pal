import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api';

type AppRole = 'chef' | 'kitchen_member' | null;

interface AuthContextType {
  user: { id: string; name: string } | null;
  role: AppRole;
  displayName: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (name: string, role?: AppRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = 'chef-local-user';

function loadUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<{ id: string; name: string; role: AppRole } | null>(loadUser);

  const signIn = useCallback(async (name: string, role: AppRole = 'chef') => {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Vui lòng nhập tên' };
    try {
      const user = await api.login(trimmed, role || 'chef');
      const data = { id: user.id, name: user.name, role: (user.role as AppRole) || 'chef' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setUserData(data);
      return { error: null };
    } catch {
      // Fallback to local-only if server is down
      const data = { id: `local-${Date.now()}`, name: trimmed, role };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setUserData(data);
      return { error: null };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserData(null);
  }, []);

  const user = userData ? { id: userData.id, name: userData.name } : null;

  return (
    <AuthContext.Provider value={{
      user,
      role: userData?.role ?? null,
      displayName: userData?.name ?? null,
      restaurantId: 'local',
      restaurantName: 'Bếp Của Tôi',
      loading: false,
      isGuest: !userData,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
