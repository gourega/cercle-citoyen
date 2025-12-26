
export enum Role {
  MEMBER = 'Membre',
  ANIMATOR = 'Animateur',
  MODERATOR = 'Modérateur',
  ADMIN = 'Administrateur',
  SUPER_ADMIN = 'Gardien'
}

export enum UserCategory {
  CITIZEN = 'Citoyen',
  ORGANIZATION = 'Organisation',
  MUNICIPALITY = 'Collectivité',
  NGO = 'ONG',
  ENTERPRISE = 'Entreprise',
  LOCAL_BUSINESS = 'Commerce de Proximité'
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  receiver_id?: string;
  conversation_id?: string;
  content: string;
  created_at: string;
  is_ai?: boolean;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: string;
  updated_at: string;
  other_participant?: User;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  circleType: CircleType;
  difficulty: 'Novice' | 'Initié' | 'Maître';
  rewardXP: number;
  currentProgress: number;
  targetGoal: number;
  participantsCount: number;
  status: 'available' | 'active' | 'completed';
  location?: string;
  deadline?: string;
  proposerId: string;
}

export enum CircleType {
  PEACE = 'Paix et Cohésion sociale',
  AGRICULTURE = 'Terre et Souveraineté',
  ECONOMY = 'Économie et entrepreneuriat',
  TECH = 'Innovation et Souveraineté',
  CULTURE = 'Arts et Patrimoine',
  URBAN = 'Vivre la Cité et Transport',
  EDUCATION = 'Éducation et citoyenneté',
  YOUTH = 'Jeunesse et leadership',
  WOMEN = 'Femmes et engagement',
  HEALTH = 'Santé et prévention',
  SOCIAL = 'Action sociale et solidarité',
  IDEAS = 'Banque des idées citoyennes',
  GARDEN = 'Sagesse Suprême'
}

export interface Idea {
  id: string;
  authorId: string;
  title: string;
  description: string;
  needs: string[];
  circleType: CircleType;
  status: 'spark' | 'incubating' | 'realized';
  vouchCount: number;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  pseudonym: string;
  bio: string;
  role: Role;
  category: UserCategory;
  isVerifiedEntity?: boolean;
  interests: string[];
  avatar: string;
  coverUrl?: string;
  impactScore?: number;
  civicStats?: { thought: number; link: number; action: number };
}

export interface Post {
  id: string;
  author_id: string;
  circle_type: CircleType;
  content: string;
  created_at: string;
  image_url?: string;
  reactions: { useful: number; relevant: number; inspiring: number };
  isMajestic?: boolean;
  isInstitutional?: boolean;
  isSuccessStory?: boolean;
  comments?: any[];
}

export interface Edict {
  id: string;
  title: string;
  proposer_id: string;
  description: string;
  status: 'voting' | 'enacted';
  votes_count: number;
  threshold: number;
  ends_at: string;
  impact_prediction?: string;
}

export interface Vote {
  id: string;
  user_id: string;
  edict_id: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  user_id: string;
  user_name?: string;
  amount: number;
  provider: 'Wave';
  status: 'pending' | 'confirmed';
  created_at: string;
}

export interface CitizenNotification {
  id: string;
  type: 'drum_call' | 'wisdom_echo' | 'award';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface EntityApplication {
  id: string;
  entityName: string;
  category: UserCategory;
  legalId: string;
  mission: string;
  proofUrl: string;
  contactEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface ResourceGift {
  id: string;
  donor_id: string;
  title: string;
  description: string;
  category: string;
  status: 'available' | 'claimed';
}

export interface ImpactProof {
  id: string;
  resourceId: string;
  recipientId: string;
  recipientName: string;
  comment: string;
  timestamp: string;
  isValidated: boolean;
}
