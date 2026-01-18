
import { createClient } from '@supabase/supabase-js';

// Fonction robuste pour lire les variables, même si injectées après le build
const getEnv = (key: string): string => {
  try {
    // On cherche d'abord dans l'objet global window injecté dans index.html
    const runtimeVar = (window as any).process?.env?.[key];
    if (runtimeVar) return runtimeVar.trim();
    
    // Fallback sur process.env (remplacé au build par Vite)
    // On utilise une syntaxe bracket pour éviter le remplacement statique agressif
    const buildVar = (process as any)["env"]?.[key];
    return (buildVar || "").trim();
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Nettoyage des quotes éventuelles
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
    if (!supabase) return { ok: false, message: "Client non initialisé (Vérifiez index.html)" };
    try {
      // Test simple pour vérifier si la table profiles existe et répond
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      return { ok: true, message: "Liaison Établie" };
    } catch (e: any) {
      console.error("Supabase Connection Error:", e);
      return { ok: false, message: e.message || "Erreur de liaison" };
    }
  }
};
