'use client';

import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthContextValue = {
  user: User | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readProfileFromMetadata(user: User): { fullName: string; phone: string } | null {
  const meta = user.user_metadata as Record<string, unknown>;
  const fullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
  if (!fullName) return null;
  return { fullName, phone: typeof meta.phone === 'string' ? meta.phone : '' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = (session: Session | null) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setIsPlatformAdmin(false);
        setLoading(false);
        return;
      }
      (async () => {
        const { data, error } = await supabase.rpc('is_platform_admin');
        if (!active) return;
        setIsPlatformAdmin(!error && data === true);
        setLoading(false);
      })();
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session);
      if (!session?.user || (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION')) return;
      const profile = readProfileFromMetadata(session.user);
      if (!profile) return;
      (async () => {
        const { error } = await supabase.rpc('ensure_my_profile', {
          p_full_name: profile.fullName,
          p_phone: profile.phone,
        });
        if (error) console.error('Profile synchronisation failed:', error.message);
      })();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isPlatformAdmin,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, isPlatformAdmin, loading, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
