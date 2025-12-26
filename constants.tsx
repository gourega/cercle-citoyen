
import React from 'react';
import { CircleType } from './types';
import { 
  ShieldCheck, 
  Sprout, 
  TrendingUp, 
  Cpu, 
  Palette, 
  Navigation, 
  BookOpen, 
  Users, 
  Star, 
  Activity, 
  Handshake,
  Lightbulb
} from 'lucide-react';

export const CIRCLES_CONFIG = [
  {
    type: CircleType.PEACE,
    icon: <ShieldCheck className="w-5 h-5" />,
    description: "Le Grand Palabre : Espace de médiation, de dialogue intercommunautaire et de justice de proximité.",
    color: "bg-slate-50 text-slate-700"
  },
  {
    type: CircleType.AGRICULTURE,
    icon: <Sprout className="w-5 h-5" />,
    description: "La Terre Nourricière : Stratégies de souveraineté alimentaire et valorisation du monde rural.",
    color: "bg-green-50 text-green-700"
  },
  {
    type: CircleType.ECONOMY,
    icon: <TrendingUp className="w-5 h-5" />,
    description: "L'Éveil Économique : Entrepreneuriat local, transformation et promotion du Made in Côte d'Ivoire.",
    color: "bg-indigo-50 text-indigo-700"
  },
  {
    type: CircleType.TECH,
    icon: <Cpu className="w-5 h-5" />,
    description: "Espace Thinkia : Innovation numérique, IA africaine et protection de notre souveraineté technologique.",
    color: "bg-purple-50 text-purple-700"
  },
  {
    type: CircleType.CULTURE,
    icon: <Palette className="w-5 h-5" />,
    description: "L'Héritage des Griots : Préservation des langues, des contes et soutien aux industries culturelles.",
    color: "bg-amber-50 text-amber-700"
  },
  {
    type: CircleType.URBAN,
    icon: <Navigation className="w-5 h-5" />,
    description: "Le Pouls Urbain : Mobilité, transport (Gbakas, Woro-woro), assainissement et cadre de vie.",
    color: "bg-blue-50 text-blue-700"
  },
  {
    type: CircleType.EDUCATION,
    icon: <BookOpen className="w-5 h-5" />,
    description: "La Forge des Esprits : Transmission des valeurs civiques et réinvention de l'éducation.",
    color: "bg-cyan-50 text-cyan-700"
  },
  {
    type: CircleType.YOUTH,
    icon: <Users className="w-5 h-5" />,
    description: "L'Énergie Nouvelle : Leadership des jeunes, mentorat et innovation sociale.",
    color: "bg-violet-50 text-violet-700"
  },
  {
    type: CircleType.WOMEN,
    icon: <Star className="w-5 h-5" />,
    description: "Les Piliers du Cercle : Promotion de l'autonomisation et de l'engagement des femmes.",
    color: "bg-rose-50 text-rose-700"
  },
  {
    type: CircleType.HEALTH,
    icon: <Activity className="w-5 h-5" />,
    description: "Le Souffle de Vie : Dialogues sur la santé publique, l'accès aux soins et la prévention.",
    color: "bg-emerald-50 text-emerald-700"
  },
  {
    type: CircleType.SOCIAL,
    icon: <Handshake className="w-5 h-5" />,
    description: "Le Ciment de la Cité : Coordination d'actions de solidarité et de secours mutuel.",
    color: "bg-orange-50 text-orange-700"
  },
  {
    type: CircleType.IDEAS,
    icon: <Lightbulb className="w-5 h-5" />,
    description: "Le Laboratoire d'Audace : Incubation d'idées visionnaires cherchant mentors, ressources ou collaborations.",
    color: "bg-yellow-50 text-yellow-700"
  }
];

export const MANIFESTO_TEXT = {
  title: "Manifeste fondateur",
  subtitle: "Un espace pour penser, relier et agir",
  intro: "Nous vivons une époque bruyante. Une époque où l'opinion précède souvent la réflexion, où l'indignation remplace l'analyse, et où l'engagement se confond trop facilement avec la mise en scène.",
  rejection: "Ce réseau est né d'un refus : le refus de l'indifférence, mais aussi le refus de la superficialité.",
  conviction: "Il est né d'une conviction simple et exigeante : une société progresse lorsque ses citoyens pensent, dialoguent et agissent ensemble, avec lucidité et responsabilité.",
  rules: [
    "Le respect est non négociable",
    "Les idées se discutent, les personnes se respectent",
    "Aucune incitation à la haine, à la violence ou à l'exclusion",
    "Pas de propagande partisane",
    "Pas de récupération personnelle ou commerciale déguisée"
  ]
};
