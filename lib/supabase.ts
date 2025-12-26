
import { createClient } from '@supabase/supabase-js';

// Configuration de l'environnement
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

/**
 * CLIENT SUPABASE SOUVERAIN
 * Utilisé pour la synchronisation en temps réel de la Cité.
 */
export const supabase = isRealSupabase
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * MOTEUR DE PERSISTANCE (SÉCURITÉ & ROBUSTESSE)
 * Gère le basculement entre la base réelle et la mémoire locale si nécessaire.
 */
export const db = {
  // Profils Citoyens
  async getProfile(id: string) {
    if (!supabase) return JSON.parse(localStorage.getItem('cercle_user') || 'null');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  // Publications du Fil
  async createPost(post: { author_id: string, content: string, circle_type: string }) {
    if (!supabase) {
      const posts = JSON.parse(localStorage.getItem('cercle_db_posts') || '[]');
      const newPost = { 
        ...post, 
        id: crypto.randomUUID(), 
        created_at: new Date().toISOString(), 
        reactions: { useful: 0, relevant: 0, inspiring: 0 } 
      };
      localStorage.setItem('cercle_db_posts', JSON.stringify([newPost, ...posts]));
      return newPost;
    }
    const { data, error } = await supabase.from('posts').insert([post]).select().single();
    if (error) throw error;
    return data;
  },

  // Système de Vote (Édits)
  async voteForEdict(userId: string, edictId: string) {
    if (!supabase) return { success: true };
    const { error: voteError } = await supabase.from('votes').insert([{ user_id: userId, edict_id: edictId }]);
    if (voteError) throw voteError;
    const { error: rpcError } = await supabase.rpc('increment_edict_votes', { row_id: edictId });
    if (rpcError) throw rpcError;
    return { success: true };
  }
};

if (!supabase) {
  console.warn("⚠️ ARCHITECTURE EN MODE DÉGRADÉ : Connectez Supabase pour activer le temps réel.");
}
