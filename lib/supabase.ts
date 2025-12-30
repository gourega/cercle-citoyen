
import { createClient } from '@supabase/supabase-js';

// Récupération des variables injectées par le define de vite.config.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Nettoyage rigoureux des valeurs injectées
const clean = (val: any) => {
  if (!val || val === 'undefined' || val === 'null' || val === '""' || val === '') return null;
  // Enlever les guillemets résiduels et espaces
  return String(val).replace(/^"|"$/g, '').trim();
};

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

// Validation : L'URL doit être une URL supabase.co valide
export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey;

export const supabase = isRealSupabase
  ? createClient(finalUrl as string, finalKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) {
      return { 
        ok: false, 
        message: "Mode Démo : Les variables 'Url Supabase' ou 'Clé public Supabase' sont mal configurées dans Cloudflare." 
      };
    }
    try {
      // Test de lecture sur la table profiles
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        // Erreur d'authentification (Clé invalide)
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          return { ok: false, message: "Erreur : La 'Clé public Supabase' est invalide (vérifiez qu'elle commence par eyJ...)." };
        }
        // La table n'existe pas encore (mais la connexion fonctionne)
        if (error.message.includes('relation') || error.code === 'PGRST116') {
          return { ok: true, message: "Liaison établie (Base connectée, tables à créer)." };
        }
        return { ok: false, message: `Erreur API : ${error.message}` };
      }
      return { ok: true, message: "Liaison avec la base souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : Vérifiez l'URL de l'API (${finalUrl}).` };
    }
  }
};
