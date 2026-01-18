
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    const runtimeVar = (window as any).process?.env?.[key];
    if (runtimeVar) return runtimeVar.trim();
    const buildVar = (process as any)["env"]?.[key];
    return (buildVar || "").trim();
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
    if (!supabase) return { ok: false, message: "Client non initialisé" };
    try {
      // Test simple pour voir si la table répond
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      // Si on a une erreur de type "PGRST116" (pas de données) c'est OK.
      // Si on a une erreur de type "42P01" c'est que la table n'existe pas.
      if (error && error.code === '42P01') {
        return { ok: false, message: "Tables manquantes (Exécutez le SQL)" };
      }

      return { ok: true, message: "Liaison Établie" };
    } catch (e: any) {
      return { ok: false, message: "Erreur de liaison" };
    }
  }
};
