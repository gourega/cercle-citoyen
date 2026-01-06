
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const clean = (val: string) => val ? val.replace(/^["']|["']$/g, '').trim() : "";

const finalUrl = clean(supabaseUrl);
const finalKey = clean(supabaseAnonKey);

export const isRealSupabase = !!finalUrl && finalUrl.includes('.supabase.co') && !!finalKey;

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
  async checkConnection() {
    if (!supabase) return { ok: false, message: "Mode Démo actif." };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s pour un diagnostic rapide

    try {
      // Test de fetch direct pour voir si c'est le domaine ou l'API qui coince
      const ping = await fetch(finalUrl + '/rest/v1/', { 
        method: 'GET', 
        headers: { 'apikey': finalKey },
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);

      if (ping.status === 401 || ping.ok) {
        return { ok: true, message: "Liaison Souveraine Active" };
      }
      
      return { ok: false, message: "Erreur passerelle API (" + ping.status + ")" };
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') return { ok: false, message: "Timeout : Liaison réseau trop lente." };
      
      // Si l'erreur est liée au SSL/Certificat, le fetch échouera ici
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        return { ok: false, message: "Blocage réseau : Vérifiez le mode SSL (doit être 'Complet')." };
      }
      
      return { ok: false, message: "Erreur de propagation DNS." };
    }
  }
};
