import { createClient } from '@supabase/supabase-js';

// Safe environment variable accessor for both Next.js and Workers
const getEnv = (name: string) => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' ? process.env[name] : undefined) ||
      (typeof globalThis !== 'undefined' ? (globalThis as any)[name] : undefined);
  } catch {
    return undefined;
  }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Default instance for Next.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Worker-safe Supabase client creator.
 * @param env Optional environment object (Cloudflare)
 * @param authHeader Optional Authorization header to forward user JWT
 */
export const getSupabase = (env?: any, authHeader?: string | null) => {
  const url = env?.NEXT_PUBLIC_SUPABASE_URL || env?.SUPABASE_URL || getEnv('NEXT_PUBLIC_SUPABASE_URL') || supabaseUrl;
  const key = env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || env?.SUPABASE_ANON_KEY || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || supabaseAnonKey;

  return createClient(url, key, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    },
  });
};
