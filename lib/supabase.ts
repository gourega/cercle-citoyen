
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
    if (!supabase) return { ok: false, message: "Mode Démo (Hors-ligne)" };

    for (let i = 0; i <= retries; i++) {
      try {
        // Un simple ping sur la table profiles (juste l'ID pour minimiser les données)
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        return { ok: true, message: "Liaison Souveraine Active" };
      } catch (e: any) {
        console.warn(`Connection attempt ${i + 1} failed:`, e.message);
        if (i < retries) {
          // Attendre 1s avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        if (e.message?.includes('Failed to fetch')) {
          return { ok: false, message: "Réseau instable..." };
        }
        return { ok: false, message: "Liaison instable" };
      }
    }
    return { ok: false, message: "Liaison instable" };
  }
};
