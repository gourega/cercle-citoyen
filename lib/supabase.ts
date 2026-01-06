
import { createClient } from '@supabase/supabase-js';

// Récupération des variables injectées
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Nettoyage rigoureux des valeurs
const clean = (val: any) => {
  if (!val || val === 'undefined' || val === 'null' || val === '""' || val === '') return null;
  return String(val).replace(/^"|"$/g, '').trim();
};

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

// Détection de configuration Stripe au lieu de Supabase
const isStripeKey = !!finalKey && finalKey.startsWith('sb_');

export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey && !isStripeKey;

if (!isRealSupabase) {
  console.warn("⚠️ Configuration Supabase manquante ou erronée. Le mode démo est activé.");
  if (isStripeKey) console.error("❌ ERREUR : Vous avez utilisé une clé Stripe au lieu de la clé 'anon' Supabase.");
}

export const supabase = isRealSupabase
  ? createClient(finalUrl as string, finalKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const db = {
  async checkConnection() {
    if (!supabase) {
      return { 
        ok: false, 
        message: `Mode Démo : Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans vos variables d'environnement.` 
      };
    }

    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        return { ok: false, message: `Liaison interrompue : ${error.message}` };
      }
      return { ok: true, message: "Liaison souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : Impossible de contacter Supabase.` };
    }
  }
};
