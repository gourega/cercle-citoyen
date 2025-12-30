
import { createClient } from '@supabase/supabase-js';

// Récupération des variables injectées par Vite
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Fonction de nettoyage pour éviter les erreurs d'injection de chaînes
const clean = (val: any) => {
  if (!val || val === 'undefined' || val === 'null' || val === '') return null;
  return val;
};

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

// On est en "Réel" si on a une URL qui commence par http et une clé qui ressemble à une clé Supabase
export const isRealSupabase = 
  !!finalUrl && 
  finalUrl.startsWith('http') && 
  !!finalKey && 
  (finalKey.length > 40); // Les clés Supabase sont très longues (JWT)

export const supabase = isRealSupabase
  ? createClient(finalUrl as string, finalKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) {
      console.warn("Connexion impossible : variables manquantes ou invalides.");
      return { ok: false, message: "Mode Démo : Liaison Cloud non configurée." };
    }
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        // Si l'erreur est juste que la table n'existe pas encore, la connexion est quand même OK
        if (error.message.includes('relation') || error.code === 'PGRST116') {
          return { ok: true, message: "Liaison établie (Tables à créer)." };
        }
        return { ok: false, message: `Erreur Supabase : ${error.message}` };
      }
      return { ok: true, message: "Liaison avec la base souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : ${e.message}` };
    }
  }
};
