
import { User, Role, UserCategory, Post, CircleType, Contribution, EntityApplication, Edict } from '../types';

export { Role, UserCategory, CircleType };
export type { User, Post, Contribution, EntityApplication, Edict };

export const ADMIN_ID = '00000000-0000-0000-0000-000000000001';

// Nettoyage complet : Seul le Gardien est conservé comme ancrage administratif
export const MOCK_USERS: Record<string, User> = {
  [ADMIN_ID]: {
    id: ADMIN_ID,
    name: 'Le Gardien du Cercle',
    email: 'cerclecitoyenci@gmail.com',
    pseudonym: 'Gardien',
    bio: 'Veille sur la cohésion, l\'éthique et la souveraineté numérique de la plateforme.',
    role: Role.SUPER_ADMIN,
    category: UserCategory.CITIZEN,
    interests: ['Gouvernance', 'Éthique', 'IA'],
    avatar: 'https://nfsskgcpqbccnwacsplc.supabase.co/storage/v1/object/public/Logo-cercle-citoyen/logo-cercle-citoyen.png',
    impactScore: 19740,
    impact_score: 19740,
    civicStats: { thought: 40, link: 30, action: 30 }
  }
};

export const MOCK_POSTS: Post[] = [];
export const MOCK_CONTRIBUTIONS: Contribution[] = [];
export const MOCK_EDICTS: Edict[] = [];
export const MOCK_APPLICATIONS: EntityApplication[] = [];
