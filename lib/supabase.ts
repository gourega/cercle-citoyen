
import { createClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

// Nettoyage des chaînes (suppression des quotes résiduelles de l'injection)
const clean = (val: string) => val.replace(/^"|"$/g, '').trim();

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey;

// Instance Supabase
export const supabase = isRealSupabase
  ? createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const db = {
  /**
   * Vérifie la liaison avec le serveur d'origine.
   * Retourne un statut détaillé pour aider au diagnostic DNS/522.
   */
  async checkConnection() {
    if (!supabase) {
      return { 
        ok: false, 
        code: 'MISSING_CONFIG',
        message: "Configuration manquante. Mode démo actif." 
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s de patience

    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        return { 
          ok: false, 
          code: 'DB_ERROR',
          message: `Liaison interrompue : ${error.message}` 
        };
      }
      return { ok: true, message: "Liaison souveraine établie." };
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        return { 
          ok: false, 
          code: 'TIMEOUT',
          message: "Délai d'attente dépassé (Possible erreur 522). Vérifiez vos DNS." 
        };
      }
      return { 
        ok: false, 
        code: 'NETWORK_ERROR',
        message: "Échec réseau : Impossible de contacter le serveur d'origine." 
      };
    }
  }
};
