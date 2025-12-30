
import { createClient } from '@supabase/supabase-js';

// Utilisation d'accès statiques pour permettre le remplacement par Vite/Cloudflare
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validation stricte pour déterminer si on est en mode "Réel" ou "Démo"
export const isRealSupabase = 
  !!supabaseUrl && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl !== '' &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'undefined' && 
  supabaseAnonKey !== '' &&
  (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_')); 

export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Mode Démo : Aucune liaison Cloud détectée." };
    try {
      // Test de lecture simple sur la table profiles
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation')) {
        return { ok: false, message: `Erreur Supabase : ${error.message}` };
      }
      return { ok: true, message: "Liaison avec la base souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : ${e.message}` };
    }
  }
};
