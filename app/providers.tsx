'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata?: any;
  [k: string]: any;
}

interface AppContextValue {
  user: SessionUser | null;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active) {
        setUser(user as SessionUser | null);
        setLoadingUser(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user as SessionUser | null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function refreshUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user as SessionUser | null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AppContext.Provider value={{ user, loadingUser, refreshUser, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppUser() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppUser debe usarse dentro de ClientProviders');
  return ctx;
}
