
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURATION SUPABASE
 * ----------------------
 * URL du Projet : https://nfsskgcpqbccnwacsplc.supabase.co
 * Clé API (Anon) : sb_secret_IHp83HpcNFdy-TecyvA3vw_VZwapNlk
 */

const getEnv = (key: string) => {
  try {
    const value = (import.meta as any).env?.[key] || 
                  (window as any).process?.env?.[key] || 
                  (window as any)[key];
    
    if (value) return value;

    // Fallback avec les clés fournies par l'utilisateur
    if (key === 'VITE_SUPABASE_URL') return 'https://nfsskgcpqbccnwacsplc.supabase.co';
    if (key === 'VITE_SUPABASE_ANON_KEY') return 'sb_secret_IHp83HpcNFdy-TecyvA3vw_VZwapNlk';
    
    return null;
  } catch {
    return null;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Détection de la validité des clés
export const isRealSupabase = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://');

// Initialisation sécurisée
export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) {
      return { 
        ok: false, 
        message: "Liaison Cloud non configurée. Veuillez vérifier vos variables d'environnement." 
      };
    }
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) return { ok: false, message: `Erreur Supabase : ${error.message}` };
      return { ok: true, message: "Liaison avec la base de données souveraine établie avec succès." };
    } catch (e: any) {
      return { ok: false, message: `Échec de la liaison réseau : ${e.message}` };
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
