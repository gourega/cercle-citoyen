
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
    id: 'announcement-online-tests',
    author_id: ADMIN_ID,
    circle_type: CircleType.PEACE,
    isMajestic: true,
    image_url: 'https://nfsskgcpqbccnwacsplc.supabase.co/storage/v1/object/public/assets/logo-512.png',
    content: "📢 APPEL AU GRAND PALABRE NUMÉRIQUE : LE CERCLE EST PRÊT.\n\nCitoyennes, Citoyens, Frères et Sœurs de vision,\n\nL’heure n’est plus à l’attente, mais à l’expérience. Après des nuits de tissage technologique et de réflexion profonde, l'infrastructure de notre souveraineté numérique est debout. \n\nLe Cercle Citoyen ouvre ses portes pour sa phase de tests massifs en ligne.\n\nCe que nous attendons de vous :\n1. Éveillez votre profil citoyen.\n2. Lancez des étincelles sur le Fil d'Éveil.\n3. Invoquez l'Esprit dans l'Assemblée Directe.\n4. Tracez les sentiers d'impact sur le terrain.\n\nRejoignez-nous. Soyez les pionniers de la souveraineté.\n\nKouassi GOBLE Ouréga\nGardien du Cercle",
    created_at: new Date().toISOString(),
    reactions: { useful: 520, relevant: 230, inspiring: 890 },
    comments: [
      { author: "Amadou Koné", avatar: "https://picsum.photos/seed/amadou/50/50", content: "Enfin ! Une fierté pour notre nation." }
    ]
  },
  {
    id: 'majestic-1',
    author_id: ADMIN_ID,
    circle_type: CircleType.GARDEN,
    isMajestic: true,
    content: "L'éveil citoyen n'est pas une destination, c'est une pratique quotidienne. Chaque dialogue responsable est une pierre à l'édifice de notre souveraineté.",
    created_at: new Date(Date.now() - 86400000).toISOString(), 
    reactions: { useful: 245, relevant: 110, inspiring: 420 },
    comments: []
  }
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [];
export const MOCK_EDICTS: Edict[] = [];
export const MOCK_APPLICATIONS: EntityApplication[] = [];
