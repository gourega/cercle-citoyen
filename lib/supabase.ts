
import { createClient } from '@supabase/supabase-js';

// Récupération sécurisée avec fallback pour éviter le crash
const getEnv = (key: string) => {
  try {
    return (process.env[key] || "").trim();
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

const clean = (val: string) => val.replace(/^["']|["']$/g, '');

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

export const isRealSupabase = !!finalUrl && finalUrl.startsWith('https://') && !!finalKey;

export const supabase = isRealSupabase 
  ? createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Mode Démo" };
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) throw error;
      return { ok: true, message: "Connecté" };
    } catch (e) {
      console.warn("Supabase Error:", e);
      return { ok: false, message: "Hors-ligne" };
    }
  }
};
