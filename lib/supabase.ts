import { createClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables d'environnement
const supabaseUrl = (process.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Nettoyage des guillemets éventuels
const clean = (val: string) => val.replace(/^["']|["']$/g, '');

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

// Vérification si Supabase est réellement utilisable
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