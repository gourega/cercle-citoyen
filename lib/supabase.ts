
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  try {
    // Vérifie process.env (injecté par Vite), puis window, puis les noms alternatifs
    const value = (process.env as any)?.[key] || 
                  (window as any)?.[key];
    
    if (value) return value;

    // Fallbacks basés sur la capture d'écran utilisateur
    if (key === 'VITE_SUPABASE_URL') return (process.env as any)?.['Url Supabase'];
    if (key === 'VITE_SUPABASE_ANON_KEY') return (process.env as any)?.['Clé public Supabase'];

    // Valeurs par défaut si rien n'est trouvé
    if (key === 'VITE_SUPABASE_URL') return 'https://nfsskgcpqbccnwacsplc.supabase.co';
    if (key === 'VITE_SUPABASE_ANON_KEY') return 'sb_publishable_HS68_yXrwqPTQGOl2wTANw_gw6HyCZ8';
    
    return null;
  } catch {
    return null;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isRealSupabase = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_')); 

export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Liaison Cloud non configurée." };
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation')) {
        return { ok: false, message: `Erreur Supabase : ${error.message}` };
      }
      return { ok: true, message: "Liaison avec la base de données souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : ${e.message}` };
    }
  }
};
