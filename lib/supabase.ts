
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

// Nettoyage rigoureux des variables d'environnement (enlève les quotes doubles ou simples accidentelles)
const clean = (val: string) => val ? val.replace(/^["']|["']$/g, '').trim() : "";

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey;

// Configuration optimisée pour la production (Cloudflare Pages)
export const supabase = isRealSupabase
  ? createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'cercle_citoyen_auth'
      },
      global: {
        headers: { 'x-application-name': 'cercle-citoyen-ci' }
      }
    })
  : null;

export const db = {
  /**
   * Vérifie la santé de la liaison entre le domaine et la base de données.
   */
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Mode Démo (Config manquante)." };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s de délai

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.error("Erreur liaison DB:", error);
        return { 
          ok: false, 
          message: error.code === 'PGRST301' ? "Accès refusé (Clé invalide)." : "Liaison DB instable." 
        };
      }
      return { ok: true, message: "Liaison Souveraine Active" };
    } catch (e: any) {
      clearTimeout(timeoutId);
      return { 
        ok: false, 
        message: e.name === 'AbortError' ? "Serveur distant injoignable (Timeout)." : "Erreur de propagation réseau." 
      };
    }
  }
};
