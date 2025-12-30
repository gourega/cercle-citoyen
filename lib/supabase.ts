
import { createClient } from '@supabase/supabase-js';

// Récupération des variables injectées par le define de vite.config.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Nettoyage rigoureux des valeurs
const clean = (val: any) => {
  if (!val || val === 'undefined' || val === 'null' || val === '""' || val === '') return null;
  return String(val).replace(/^"|"$/g, '').trim();
};

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

// On autorise toute URL commençant par http pour permettre à l'utilisateur de voir les erreurs réelles de Supabase
export const isRealSupabase = !!finalUrl && finalUrl.startsWith('http') && !!finalKey && finalKey.length > 20;

export const supabase = isRealSupabase
  ? createClient(finalUrl as string, finalKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) {
      return { ok: false, message: "Mode Démo : Aucune variable détectée dans Cloudflare." };
    }
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        // Si l'erreur est liée à l'URL (ex: 404), on le dit clairement
        if (error.message.includes('fetch') || error.code === '404') {
          return { ok: false, message: "L'URL Supabase dans Cloudflare est incorrecte (doit finir par .supabase.co)." };
        }
        if (error.message.includes('JWT') || error.code === 'PGRST301') {
          return { ok: false, message: "La Clé Supabase (Anon Key) est invalide." };
        }
        // Si l'erreur est juste que la table n'existe pas, la connexion est valide
        if (error.message.includes('relation') || error.code === 'PGRST116') {
          return { ok: true, message: "Liaison établie (Base prête)." };
        }
        return { ok: false, message: `Erreur Supabase : ${error.message}` };
      }
      return { ok: true, message: "Liaison avec la base souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : Vérifiez l'URL de l'API dans Cloudflare.` };
    }
  }
};
