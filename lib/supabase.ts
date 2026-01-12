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
  async checkConnection(retries = 2): Promise<{ok: boolean, message: string}> {
    if (!supabase) return { ok: false, message: "Mode Déconnecté" };

    for (let i = 0; i <= retries; i++) {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        return { ok: true, message: "Système Opérationnel" };
      } catch (e: any) {
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return { ok: false, message: "Connexion instable" };
      }
    }
    return { ok: false, message: "Erreur de liaison" };
  }
};