import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE
 */
const getEnv = (key: string) => {
  try {
    return (window as any).process?.env?.[key] || (import.meta as any).env?.[key] || (window as any)[key];
  } catch {
    return null;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('Url Supabase');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('Clé public Supabase');

// Détection de la connexion réelle
export const isRealSupabase = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  typeof supabaseUrl === 'string' &&
  supabaseUrl.includes('.supabase.co');

if (isRealSupabase) {
  console.log("[CERCLE] Connecté à Supabase:", supabaseUrl);
} else {
  console.warn("[CERCLE] Mode Démo. Variables manquantes ou invalides.");
}

// Simulateur de Supabase (Mode Démo de secours)
const mockSupabase = {
  auth: {
    onAuthStateChange: (callback: any) => {
      callback('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: ({ email }: { email: string }) => {
      if (email === 'cerclecitoyenci@gmail.com') {
        return Promise.resolve({ data: { user: { id: 'cdde4873-dd75-4c09-bcb2-6eb1aa960c12' } }, error: null });
      }
      return Promise.resolve({ data: { user: null }, error: { message: "Identifiants incorrects" } });
    },
    signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
      contains: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }),
    insert: (data: any) => Promise.resolve({ data, error: null }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} })
  }),
  removeChannel: () => {}
};

export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : (mockSupabase as any);