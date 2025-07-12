"use client";
import {
  createClientComponentClient,
  createServerComponentClient,
  type User,
} from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const createClient = () =>
  createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnon,
  });

export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({
    cookies: () => cookieStore,
    supabaseUrl,
    supabaseKey: supabaseAnon,
  });
};

export const supabase = createClient();
export type { User };
