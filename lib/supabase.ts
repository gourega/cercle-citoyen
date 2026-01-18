
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
    if (!supabase) return { ok: false, message: "Client non initialisé (Vérifiez index.html)" };
    try {
      // Test de la table profiles
      const { error: profileError } = await supabase.from('profiles').select('id').limit(1);
      if (profileError) throw new Error("Table 'profiles' manquante");

      // Test de la table posts (pour les Ondes)
      const { error: postError } = await supabase.from('posts').select('id').limit(1);
      if (postError && postError.code !== 'PGRST116') {
        return { ok: true, message: "Liaison OK (Attention: Table 'posts' manquante)" };
      }

      return { ok: true, message: "Liaison Établie" };
    } catch (e: any) {
      console.error("Supabase Connection Error:", e);
      return { ok: false, message: e.message || "Erreur de liaison" };
    }
  }
};
