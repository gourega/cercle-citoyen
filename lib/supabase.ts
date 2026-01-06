
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const clean = (val: string) => val.replace(/^"|"$/g, '').trim();
const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey;

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
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Configuration manquante (Mode Démo)." };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        // Détection d'erreur de clé ou de table manquante
        if (error.code === 'PGRST301') return { ok: false, message: "Erreur d'authentification base de données." };
        return { ok: false, message: "Liaison base de données interrompue." };
      }
      return { ok: true, message: "Liaison souveraine établie." };
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        return { 
          ok: false, 
          message: "Délai dépassé : vérifiez la liaison Cloudflare Pages <-> Supabase." 
        };
      }
      return { 
        ok: false, 
        message: "Erreur réseau : propagation DNS en cours ou blocage SSL." 
      };
    }
  }
};
