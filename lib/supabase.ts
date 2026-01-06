
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const clean = (val: string) => val ? val.replace(/^["']|["']$/g, '').trim() : "";

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey;

export const supabase = isRealSupabase
  ? createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'cercle_citoyen_auth'
      }
    })
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Mode Démo (Hors-ligne)" };

    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
      if (error) throw error;
      return { ok: true, message: "Liaison Souveraine Active" };
    } catch (e: any) {
      console.error("DB Connection Error:", e);
      if (e.message?.includes('Failed to fetch')) {
        return { ok: false, message: "Erreur DNS : Propagation en cours..." };
      }
      return { ok: false, message: "Liaison instable" };
    }
  }
};
