
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE
 * ----------------------
 * URL API : https://nfsskgcpqbccnwacsplc.supabase.co
 * CLÉ : Clé publique (publishable) fournie par l'utilisateur.
 */

const getEnv = (key: string) => {
  try {
    const value = (import.meta as any).env?.[key] || 
                  (window as any).process?.env?.[key] || 
                  (window as any)[key];
    
    if (value) return value;

    // Configuration automatique basée sur les informations fournies
    if (key === 'VITE_SUPABASE_URL') return 'https://nfsskgcpqbccnwacsplc.supabase.co';
    
    // Clé publique fournie par l'utilisateur : sb_publishable_HS68_yXrwqPTQGOl2wTANw_gw6HyCZ8
    if (key === 'VITE_SUPABASE_ANON_KEY') return 'sb_publishable_HS68_yXrwqPTQGOl2wTANw_gw6HyCZ8';
    
    return null;
  } catch {
    return null;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Détection de la validité
// Une clé publique Supabase peut être un JWT (eyJ...) ou une clé publishable (sb_publishable_...)
export const isRealSupabase = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_')); 

export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) {
      if (supabaseAnonKey && supabaseAnonKey.startsWith('sb_secret_')) {
        return { ok: false, message: "ERREUR : Vous utilisez une clé secrète (sb_secret...). Utilisez la clé 'anon' ou 'publishable'." };
      }
      return { ok: false, message: "Liaison Cloud non configurée ou format de clé invalide." };
    }
    try {
      // Test simple pour vérifier la connectivité
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      // Si l'erreur est "relation does not exist", la connexion est OK mais les tables manquent
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation')) {
        return { ok: false, message: `Erreur Supabase : ${error.message}` };
      }
      
      return { ok: true, message: "Liaison avec la base de données souveraine établie avec succès." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : ${e.message}` };
    }
  },

  async updateProfile(id: string, updates: any) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
    return data;
  }
};
