import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type AppRole = 'chef' | 'kitchen_member' | null;

interface AuthContextType {
  user: User | null;
  role: AppRole;
  displayName: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
    if (!error && data) setRole(data as AppRole);
    else setRole(null);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();
    if (data) setDisplayName(data.display_name);
  };

  useEffect(() => {
    let resolved = false;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (resolved) return;
        resolved = true;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await Promise.all([fetchRole(currentUser.id), fetchProfile(currentUser.id)]);
        }
      } catch (e) {
        console.error('Initial session error:', e);
      } finally {
        setLoading(false);
      }
    };

    // Timeout fallback: if getSession hangs, resolve after 3s
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 3000);

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await Promise.all([fetchRole(currentUser.id), fetchProfile(currentUser.id)]);
      } else {
        setRole(null);
        setDisplayName(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, displayName, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
