import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type AppRole = 'chef' | 'kitchen_member' | null;

interface AuthContextType {
  user: User | null;
  role: AppRole;
  displayName: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
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

  const fetchRestaurant = async (userId: string) => {
    // Get restaurant_id from user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('restaurant_id')
      .eq('user_id', userId)
      .single();

    if (roleData?.restaurant_id) {
      setRestaurantId(roleData.restaurant_id);
      // Fetch restaurant name
      const { data: restData } = await (supabase as any)
        .from('restaurants')
        .select('name')
        .eq('id', roleData.restaurant_id)
        .single();
      if (restData) setRestaurantName(restData.name);
    }
  };

  useEffect(() => {
    let initialLoad = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setTimeout(async () => {
          await Promise.all([
            fetchRole(currentUser.id),
            fetchProfile(currentUser.id),
            fetchRestaurant(currentUser.id),
          ]);
          setLoading(false);
          initialLoad = false;
        }, 0);
      } else {
        setRole(null);
        setDisplayName(null);
        setRestaurantId(null);
        setRestaurantName(null);
        setLoading(false);
        initialLoad = false;
      }
    });

    const timeout = setTimeout(() => {
      if (initialLoad) {
        initialLoad = false;
        setLoading(false);
      }
    }, 3000);

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
    <AuthContext.Provider value={{
      user, role, displayName, restaurantId, restaurantName,
      loading, isGuest: !user && !loading, signIn, signOut,
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
