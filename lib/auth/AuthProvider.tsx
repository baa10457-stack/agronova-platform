'use client';

import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthContextValue = {
  user: User | null;
  avatarUrl: string | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readProfileFromMetadata(
  user: User,
): { fullName: string; phone: string } | null {
  const meta = user.user_metadata as Record<string, unknown>;
  const fullName =
    typeof meta.full_name === 'string' ? meta.full_name.trim() : '';

  if (!fullName) return null;

  return {
    fullName,
    phone: typeof meta.phone === 'string' ? meta.phone : '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProfileAvatar = async (currentUser: User) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error('Avatar loading failed:', error.message);
        setAvatarUrl(null);
        return;
      }

      const avatarPath = data?.avatar_url;

      if (!avatarPath) {
        const metadata = currentUser.user_metadata as Record<string, unknown>;
        const fallback =
          typeof metadata.avatar_url === 'string'
            ? metadata.avatar_url
            : typeof metadata.picture === 'string'
              ? metadata.picture
              : null;

        setAvatarUrl(fallback);
        return;
      }

      if (avatarPath.startsWith('http')) {
        setAvatarUrl(avatarPath);
        return;
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('profile-avatars')
        .createSignedUrl(avatarPath, 3600);

      if (!active) return;

      if (signedError) {
        console.error('Avatar URL generation failed:', signedError.message);
        setAvatarUrl(null);
        return;
      }

      setAvatarUrl(signedData.signedUrl);
    };

    const applySession = async (session: Session | null) => {
      const nextUser = session?.user ?? null;

      setUser(nextUser);

      if (!nextUser) {
        setAvatarUrl(null);
        setIsPlatformAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_platform_admin');

      if (!active) return;

      setIsPlatformAdmin(!error && data === true);

      const profile = readProfileFromMetadata(nextUser);

      if (profile) {
        const { error: profileError } = await supabase.rpc(
          'ensure_my_profile',
          {
            p_full_name: profile.fullName,
            p_phone: profile.phone,
          },
        );

        if (profileError) {
          console.error(
            'Profile synchronisation failed:',
            profileError.message,
          );
        }
      }

      await loadProfileAvatar(nextUser);

      if (active) setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      avatarUrl,
      isPlatformAdmin,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, avatarUrl, isPlatformAdmin, loading, supabase],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
