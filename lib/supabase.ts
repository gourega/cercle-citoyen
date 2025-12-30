
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

// Détection de l'erreur courante : utilisation de clés Stripe (sb_...) au lieu de Supabase (eyJ...)
const isStripeKey = !!finalKey && finalKey.startsWith('sb_');

// Validation : L'URL doit être une URL supabase.co valide et la clé ne doit pas être une clé Stripe
export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey && !isStripeKey;

export const supabase = isRealSupabase
  ? createClient(finalUrl as string, finalKey as string)
  : null;

export const db = {
  async checkConnection() {
    if (isStripeKey) {
      return { 
        ok: false, 
        message: "Attention : La clé détectée est une clé Stripe (sb_...). Utilisez la clé 'anon' de Supabase (eyJ...)." 
      };
    }

    if (!supabase) {
      return { 
        ok: false, 
        message: `Mode Démo : Vérifiez que vos variables 'Url Supabase' et 'Clé anon Supabase' sont bien enregistrées ET que vous avez relancé un déploiement.` 
      };
    }

    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          return { ok: false, message: "La clé configurée est invalide ou expirée. Copiez la clé 'anon public' depuis Supabase." };
        }
        if (error.message.includes('relation') || error.code === 'PGRST116') {
          return { ok: true, message: "Base connectée ! (Les tables seront créées à la première inscription)." };
        }
        return { ok: false, message: `Erreur Supabase : ${error.message}` };
      }
      return { ok: true, message: "Liaison souveraine établie." };
    } catch (e: any) {
      return { ok: false, message: `Échec réseau : Impossible de contacter ${finalUrl}.` };
    }
  }
};
