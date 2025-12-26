
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  try {
    return (window as any).process?.env?.[key] || (import.meta as any).env?.[key] || (window as any)[key];
  } catch {
    return null;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('Url Supabase');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('Clé public Supabase');

export const isRealSupabase = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  typeof supabaseUrl === 'string' &&
  supabaseUrl.includes('.supabase.co');

// Si Supabase est configuré, on utilise le client réel avec Realtime activé
export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Mécanisme de secours (Fallback) uniquement si les clés sont manquantes
if (!supabase) {
  console.warn("⚠️ ALERTE ARCHITECTURE : Clés Supabase manquantes. L'architecture est en mode dégradé (LocalStorage). Pour une robustesse totale, configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
}

/**
 * Fonctions utilitaires pour la Robustesse
 */
export const db = {
  // Récupérer le profil complet d'un citoyen
  async getProfile(id: string) {
    if (!supabase) return JSON.parse(localStorage.getItem('cercle_user') || 'null');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  // Publier dans la mémoire du Cercle
  async createPost(post: { author_id: string, content: string, circle_type: string }) {
    if (!supabase) {
      const posts = JSON.parse(localStorage.getItem('cercle_db_posts') || '[]');
      const newPost = { ...post, id: crypto.randomUUID(), created_at: new Date().toISOString(), reactions: { useful: 0, relevant: 0, inspiring: 0 } };
      localStorage.setItem('cercle_db_posts', JSON.stringify([newPost, ...posts]));
      return newPost;
    }
    const { data, error } = await supabase.from('posts').insert([post]).select().single();
    if (error) throw error;
    return data;
  }
};
