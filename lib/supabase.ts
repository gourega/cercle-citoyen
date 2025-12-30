
import { createClient } from '@supabase/supabase-js';

// Récupération des variables injectées par le define de vite.config.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Nettoyage rigoureux des valeurs
const clean = (val: any) => {
  if (!val || val === 'undefined' || val === 'null' || val === '""' || val === '') return null;
  // Enlever les guillemets résiduels si injection malpropre
  return String(val).replace(/^"|"$/g, '');
};

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

// Log discret pour debug en console si besoin (F12)
if (!finalUrl || !finalKey) {
  console.log("Supabase : Variables manquantes. Mode Démo actif.");
}

export const isRealSupabase = !!finalUrl && !!finalKey && finalUrl.includes('.supabase.co');

export const supabase = isRealSupabase
  ? createClient(finalUrl as string, finalKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) {
      return { ok: false, message: "Mode Démo : Liaison Cloud non configurée." };
    }
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        if (error.message.includes('relation') || error.code === 'PGRST116') {
          return { ok: true, message: "Liaison établie (Base prête)." };
        }
        return { ok: false, message: `Erreur : ${error.message}` };
      }
      return { ok: true, message: "Liaison avec la base souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : ${e.message}` };
    }
  }
};
