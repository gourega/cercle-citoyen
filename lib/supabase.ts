
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  try {
    return (
      (window as any).process?.env?.[key] || 
      (import.meta as any).env?.[key] || 
      (window as any)[key] ||
      null
    );
  } catch {
    return null;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isRealSupabase = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://');

if (!supabaseUrl) console.warn("Diagnostic Supabase : VITE_SUPABASE_URL est manquante.");
if (!supabaseAnonKey) console.warn("Diagnostic Supabase : VITE_SUPABASE_ANON_KEY est manquante.");

export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Variables d'environnement (URL ou Clé) manquantes." };
    try {
      // On teste une lecture simple
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) return { ok: false, message: error.message };
      return { ok: true, message: "Liaison avec la base de données établie." };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  },

  async updateProfile(id: string, updates: any) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  }
};
