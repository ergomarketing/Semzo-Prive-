'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getSupabaseBrowser } from './lib/supabaseClient';

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
  supabase: any | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Ya NO llamamos getSupabaseBrowser() top-level.
  const supabaseRef = useRef<any | null>(null);

  // Inicializamos solo en cliente
  if (typeof window !== 'undefined' && !supabaseRef.current) {
    supabaseRef.current = getSupabaseBrowser(); // puede devolver null si algo falta
  }

  const supabase = supabaseRef.current;
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // No hay cliente todavía (SSR o variables faltantes)
      setLoadingUser(false);
      return;
    }
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
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user as SessionUser | null);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AppContext.Provider value={{ user, loadingUser, refreshUser, signOut, supabase }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppUser() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppUser debe usarse dentro de ClientProviders');
  return ctx;
}
