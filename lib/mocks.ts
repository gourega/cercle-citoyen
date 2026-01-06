
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
    id: 'peace-edict',
    author_id: ADMIN_ID,
    circle_type: CircleType.PEACE,
    is_majestic: true,
    content: "**LE SACRE DE LA PAIX : AU-DELÀ DES URNES, LA FRATERNITÉ**\n\nFrères et Sœurs, le bruit des urnes s'est tu, mais l'écho des tensions résonne encore dans nos foyers et nos quartiers. Les cicatrices de ces périodes électorales ne doivent pas devenir les fossés de demain.\n\nLa démocratie est un outil, mais la Paix est notre fondation. Une élection n'est qu'un passage ; notre destin de peuple, lui, est éternel. Ici, dans ce Cercle, nous refusons que le sang ou la colère dictent notre marche.\n\nJ'appelle chaque citoyen au **Grand Palabre de la Réconciliation**. Ne cherchez pas qui a tort, cherchez comment nous pouvons, ensemble, recoudre le pagne déchiré de notre unité nationale. La Côte d'Ivoire ne se construit pas contre l'autre, elle se bâtit avec lui.\n\nKouassi GOBLE Ouréga",
    created_at: new Date().toISOString(),
    reactions: { useful: 2450, relevant: 1890, inspiring: 4200 },
    comments: []
  },
  {
    id: 'launch-official',
    author_id: ADMIN_ID,
    circle_type: CircleType.TECH,
    is_majestic: true,
    content: "**APPEL À LA SOUVERAINETÉ COLLECTIVE**\n\nLe Cercle n'est pas qu'une plateforme, c'est un serment. Celui de ne plus être de simples spectateurs de notre destin, mais les architectes de notre progrès social.\n\nIci, nous ne cherchons pas le clic, mais l'impact. Nous ne cherchons pas le buzz, mais la vérité.\n\nKouassi GOBLE Ouréga",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    reactions: { useful: 1240, relevant: 850, inspiring: 2100 },
    comments: []
  },
  {
    id: 'inst-post-1',
    author_id: 'u2',
    circle_type: CircleType.URBAN,
    isInstitutional: true,
    content: "La Mairie de Bouaké lance aujourd'hui son premier 'Sentier d'Impact' sur la gestion participative des déchets dans le quartier Commerce. \n\nNous invitons tous les résidents à consulter la carte territoriale pour voir les points de collecte citoyenne.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    reactions: { useful: 340, relevant: 120, inspiring: 45 },
    comments: []
  }
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [];
export const MOCK_EDICTS: Edict[] = [];
export const MOCK_APPLICATIONS: EntityApplication[] = [];
