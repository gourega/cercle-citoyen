
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
  u2: {
    id: 'u2',
    name: 'Mairie de Bouaké',
    email: 'contact@mairiebouake.ci',
    pseudonym: 'BouakéOfficiel',
    bio: 'Compte institutionnel de la commune de Bouaké. Agir pour nos citoyens.',
    role: Role.MEMBER,
    category: UserCategory.MUNICIPALITY,
    isVerifiedEntity: true,
    interests: ['Urbanisme', 'Social'],
    avatar: 'https://picsum.photos/seed/bouake/150/150',
    impactScore: 5400,
    impact_score: 5400
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
    id: 'launch-official',
    author_id: ADMIN_ID,
    circle_type: CircleType.PEACE,
    is_majestic: true,
    content: "**APPEL À LA SOUVERAINETÉ COLLECTIVE**\n\nFrères et Sœurs de Côte d'Ivoire,\n\nLe Cercle n'est pas qu'une plateforme, c'est un serment. Celui de ne plus être de simples spectateurs de notre destin, mais les architectes de notre progrès social.\n\nIci, nous ne cherchons pas le clic, mais l'impact. Nous ne cherchons pas le buzz, mais la vérité.\n\nBienvenue dans votre nouvelle demeure numérique.\n\nKouassi GOBLE Ouréga",
    created_at: new Date().toISOString(),
    reactions: { useful: 1240, relevant: 850, inspiring: 2100 },
    comments: []
  },
  {
    id: 'inst-post-1',
    author_id: 'u2',
    circle_type: CircleType.URBAN,
    isInstitutional: true,
    content: "La Mairie de Bouaké lance aujourd'hui son premier 'Sentier d'Impact' sur la gestion participative des déchets dans le quartier Commerce. \n\nNous invitons tous les résidents à consulter la carte territoriale pour voir les points de collecte citoyenne.",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    reactions: { useful: 340, relevant: 120, inspiring: 45 },
    comments: []
  },
  {
    id: 'citoyen-post-1',
    author_id: 'u1',
    circle_type: CircleType.AGRICULTURE,
    content: "Hier, nous avons testé la première pompe solaire partagée dans notre coopérative à Boundiali. L'impact sur notre souveraineté alimentaire est immédiat. Merci au Cercle pour la mise en relation avec les ingénieurs d'Espace Thinkia !",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    reactions: { useful: 89, relevant: 42, inspiring: 156 },
    comments: []
  }
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [];
export const MOCK_EDICTS: Edict[] = [];
export const MOCK_APPLICATIONS: EntityApplication[] = [];
