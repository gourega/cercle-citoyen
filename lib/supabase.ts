
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  // Priorité absolue aux variables injectées par Vite
  return (process.env as any)?.[key] || null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// On vérifie que les clés ne sont pas juste des chaînes "undefined" ou vides
export const isRealSupabase = 
  !!supabaseUrl && 
  supabaseUrl !== 'undefined' &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'undefined' &&
  (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_')); 

export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Variables d'environnement non détectées." };
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation')) {
        return { ok: false, message: `Erreur base : ${error.message}` };
      }
      return { ok: true, message: "Liaison avec la base souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : ${e.message}` };
    }
  }
};
