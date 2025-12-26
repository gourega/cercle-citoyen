
import React, { useState } from 'react';
import { 
  Building2, 
  Target, 
  Package, 
  Handshake, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Zap, 
  Briefcase,
  History,
  Heart,
  ArrowRight,
  Globe,
  Star,
  Users,
  MessageSquare,
  Loader2,
  Sparkles,
  Camera,
  Check
} from 'lucide-react';
import { User, UserCategory, ResourceGift, ImpactProof } from '../types';
import { MOCK_USERS } from '../lib/mocks';
import { analyzeCommunityReputation } from '../lib/gemini';

const BusinessPortal: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'impact' | 'resources' | 'community' | 'proofs'>('impact');
  const [isAuditing, setIsAuditing] = useState(false);
  const [reputation, setReputation] = useState<any>(null);
  
  const isLocalBusiness = user.category === UserCategory.LOCAL_BUSINESS;

  const impactStats = [
    { label: "Vies Impactées", value: isLocalBusiness ? "450" : "12,400", icon: Heart, color: "text-rose-600" },
    { label: "Quêtes Soutenues", value: isLocalBusiness ? "2" : "8", icon: Target, color: "text-blue-600" },
    { label: "Score Confiance", value: "92/100", icon: ShieldCheck, color: "text-teal-600" },
    { label: "Points d'Impact", value: isLocalBusiness ? "1,200" : "45,000", icon: Zap, color: "text-amber-600" },
  ];

  const handleAuditReputation = async () => {
    setIsAuditing(true);
    try {
      const mockVouches = [
        "C'est le meilleur tailleur du quartier, il aide toujours les jeunes.",
        "Toujours honnête sur les prix et participe aux nettoyages collectifs.",
        "Un pilier pour nous, il a offert des masques pendant la crise."
      ];
      const res = await analyzeCommunityReputation(user.name, mockVouches);
      setReputation(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const proofs: ImpactProof[] = [
    { id: 'ip1', resourceId: 'r1', recipientId: 'u1', recipientName: 'École Primaire de Boundiali', comment: 'Nous avons bien reçu les kits solaires. Les enfants peuvent enfin étudier le soir !', timestamp: 'Hier', isValidated: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className={`bg-gradient-to-br ${isLocalBusiness ? 'from-emerald-900 to-teal-800' : 'from-gray-900 via-slate-900 to-teal-900'} rounded-[3rem] p-12 text-white mb-12 relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
          {isLocalBusiness ? <Star className="w-48 h-48" /> : <Briefcase className="w-48 h-48" />}
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="font-black text-[10px] uppercase tracking-[0.5em] text-teal-400 mb-4">
            {isLocalBusiness ? 'Sceau de Proximité' : 'Label Pilier Économique'}
          </h3>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Votre impact est <span className="text-teal-400 italic">vérifié</span>.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            Ici, pas besoin de bilans comptables secrets. Vos points de confiance se gagnent sur le terrain, certifiés par ceux que vous aidez.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              {isLocalBusiness ? 'Offrir un Service' : 'Proposer une Ressource'}
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Voir les Quêtes Actives
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {impactStats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-serif font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex bg-gray-100 p-2 rounded-2xl mb-12 w-fit overflow-x-auto max-w-full">
        {(['impact', 'resources', 'community', 'proofs'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab === 'impact' ? 'Tableau d\'Impact' : tab === 'resources' ? 'Ressources' : tab === 'community' ? 'Réputation' : 'Preuves de Réception'}
          </button>
        ))}
      </div>

      {activeTab === 'proofs' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
               <CheckCircle2 className="w-6 h-6" />
             </div>
             <div>
               <h3 className="font-serif font-bold text-2xl">Registre des Réceptions</h3>
               <p className="text-sm text-gray-500">Chaque action confirmée par un bénéficiaire renforce votre Sceau de Pilier.</p>
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {proofs.map(proof => (
               <div key={proof.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex gap-6 items-start group">
                 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                    <Camera className="w-8 h-8 text-gray-300 group-hover:text-emerald-500" />
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between mb-4">
                     <h4 className="font-bold text-gray-900">{proof.recipientName}</h4>
                     <span className="text-[10px] font-black text-emerald-600 uppercase">Validé par le Pilier</span>
                   </div>
                   <p className="text-sm text-gray-600 leading-relaxed italic mb-4">"{proof.comment}"</p>
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                     <History className="w-3 h-3" /> {proof.timestamp}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPortal;
