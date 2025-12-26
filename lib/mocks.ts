
import { User, Role, UserCategory, Post, CircleType, Contribution, EntityApplication, Edict } from '../types';

export { Role, UserCategory, CircleType };
export type { User, Post, Contribution, EntityApplication, Edict };

// Identifiant réel de Kouassi GOBLE Ouréga
export const ADMIN_ID = 'cdde4873-dd75-4c09-bcb2-6eb1aa960c12';

export const MOCK_USERS: Record<string, User> = {
  u1: {
    id: 'u1',
    name: 'Amadou Koné',
    email: 'amadou.kone@citoyen.ci',
    pseudonym: 'AmadouK',
    bio: 'Passionné par le développement local et l\'éducation citoyenne en Côte d\'Ivoire.',
    role: Role.MEMBER,
    category: UserCategory.CITIZEN,
    interests: ['Éducation', 'Environnement'],
    avatar: 'https://picsum.photos/seed/amadou/150/150',
    impactScore: 120,
    impact_score: 120,
    civicStats: { thought: 65, link: 20, action: 15 }
  },
  [ADMIN_ID]: {
    id: ADMIN_ID,
    name: 'Kouassi GOBLE Ouréga',
    email: 'cerclecitoyenci@gmail.com',
    pseudonym: 'GardienSuprême',
    bio: 'Fondateur et Gardien du Cercle. Citoyen engagé pour la souveraineté numérique et sociale.',
    role: Role.SUPER_ADMIN,
    category: UserCategory.CITIZEN,
    interests: ['Gouvernance', 'Éthique', 'Éducation'],
    avatar: 'https://picsum.photos/seed/goble/300/300',
    impactScore: 19740,
    impact_score: 19740,
    civicStats: { thought: 40, link: 30, action: 30 }
  }
};

export const MOCK_POSTS: Post[] = [
  {
    id: 'majestic-1',
    author_id: ADMIN_ID,
    circle_type: CircleType.GARDEN,
    isMajestic: true,
    content: "L'éveil citoyen n'est pas une destination, c'est une pratique quotidienne. Chaque dialogue responsable est une pierre à l'édifice de notre souveraineté.",
    created_at: new Date().toISOString(),
    reactions: { useful: 245, relevant: 110, inspiring: 420 },
    comments: []
  }
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [];
export const MOCK_EDICTS: Edict[] = [];
export const MOCK_APPLICATIONS: EntityApplication[] = [];
