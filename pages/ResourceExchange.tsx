
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Plus, Search, Loader2, Package, Sparkles, Heart, ArrowRight, X, CheckCircle2, ShoppingBag, ChevronLeft, ShieldCheck, Zap } from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { User, ResourceGift } from '../types.ts';
import { useToast } from '../ToastContext.tsx';

const MOCK_RESOURCES: ResourceGift[] = [
  {
    id: 'm1',
    donor_id: 'u1',
    title: 'Kit de semences maraîchères',
    description: 'Lot de graines de tomates, piments et gombos pour potager citoyen.',
    category: 'Agriculture',
    status: 'available'
  },
  {
    id: 'm2',
    donor_id: 'u2',
    title: 'Lot de 10 manuels scolaires',
    description: 'Livres de mathématiques et français niveau CM2, très bon état.',
    category: 'Éducation',
    status: 'available'
  },
  {
    id: 'm3',
    donor_id: 'u3',
    title: 'Machine à coudre manuelle',
    description: 'Fonctionnelle, idéale pour apprentissage en centre communautaire.',
    category: 'Outils',
    status: 'claimed'
  }
];

const StepCard: React.FC<{ icon: React.ReactNode, title: string, text: string, color: string }> = ({ icon, title, text, color }) => (
  <div className={`p-6 rounded-[2rem] border ${color} bg-white/50 flex flex-col items-center text-center shadow-sm`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm bg-white text-gray-900`}>
      {icon}
    </div>
    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">{title}</h4>
    <p className="text-xs text-gray-500 font-medium leading-relaxed">{text}</p>
  </div>
);

const ResourceCard: React.FC<{ resource: ResourceGift, onClaim: (id: string) => void }> = ({ resource, onClaim }) => (
  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
      <Package size={80} />
    </div>
    
    <div className="flex justify-between items-start mb-6">
      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${resource.status === 'available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
        {resource.status === 'available' ? 'Disponible' : 'Réclamé'}
      </span>
      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
        <Heart size={18} fill={resource.status === 'claimed' ? 'currentColor' : 'none'} />
      </div>
    </div>

    <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">{resource.title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow line-clamp-2">{resource.description}</p>

    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{resource.category}</span>
      {resource.status === 'available' && (
        <button 
          onClick={() => onClaim(resource.id)}
          className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1 hover:underline"
        >
          Réclamer <ArrowRight size={12} />
        </button>
      )}
    </div>
  </div>
);

const ResourceExchange: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const [resources, setResources] = useState<ResourceGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', description: '', category: 'Outils' });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('resource_gifts').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setResources(data);
        } else {
          setResources(MOCK_RESOURCES);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        setResources(MOCK_RESOURCES);
      }
    } catch (e) {
      setResources(MOCK_RESOURCES);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newResource.title.trim()) return;
    
    if (isRealSupabase && supabase) {
      const { error } = await supabase.from('resource_gifts').insert([{
        donor_id: user.id,
        title: newResource.title,
        description: newResource.description,
        category: newResource.category,
        status: 'available'
      }]);
      if (error) {
        addToast("Erreur lors de la publication.", "error");
        return;
      }
    } else {
      const mockNew: ResourceGift = {
        id: Date.now().toString(),
        donor_id: user.id,
        title: newResource.title,
        description: newResource.description,
        category: newResource.category,
        status: 'available'
      };
      setResources(prev => [mockNew, ...prev]);
    }

    addToast("Don ajouté au catalogue !", "success");
    setIsModalOpen(false);
    setNewResource({ title: '', description: '', category: 'Outils' });
    if (isRealSupabase) fetchResources();
  };

  const handleClaim = async (id: string) => {
    if (isRealSupabase && supabase) {
      const { error } = await supabase.from('resource_gifts').update({ status: 'claimed' }).eq('id', id);
      if (error) {
        addToast("Erreur lors de la réclamation.", "error");
        return;
      }
    } else {
      setResources(prev => prev.map(r => r.id === id ? { ...r, status: 'claimed' } : r));
    }
    addToast("Demande transmise au donateur !", "success");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="mb-8">
        <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au fil citoyen
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Le Marché de Solidarité</h1>
          <p className="text-gray-500 max-w-xl text-lg font-medium leading-relaxed">
            Ici, les surplus des uns deviennent les opportunités des autres. L'économie circulaire citoyenne.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-10 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3"
        >
          <Plus size={20} /> Proposer un Don
        </button>
      </div>

      {/* SECTION EXPLICATIVE : LE PACTE DE SOLIDARITÉ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <StepCard 
          icon={<Heart className="text-rose-500" />}
          title="1. Offrez"
          text="Mettez à disposition une ressource dont vous n'avez plus l'utilité directe pour la communauté."
          color="border-rose-100 bg-rose-50/20"
        />
        <StepCard 
          icon={<Handshake className="text-blue-500" />}
          title="2. Échangez"
          text="Un citoyen réclame la ressource. Le système organise la rencontre en toute sécurité."
          color="border-blue-100 bg-blue-50/20"
        />
        <StepCard 
          icon={<Zap className="text-amber-500" />}
          title="3. Impactez"
          text="Validez l'échange pour transformer ce geste en points d'impact (XP) pour votre profil souverain."
          color="border-amber-100 bg-amber-50/20"
        />
      </div>

      <div className="mb-12 relative max-w-2xl mx-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
        <input 
          placeholder="Rechercher une ressource..." 
          className="w-full bg-white border border-gray-100 py-6 pl-16 pr-6 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-rose-50 transition-all font-medium"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-rose-600 w-12 h-12" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.length > 0 ? (
            resources.map(res => <ResourceCard key={res.id} resource={res} onClaim={handleClaim} />)
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-50">
               <ShoppingBag className="w-16 h-16 text-gray-100 mx-auto mb-6" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Le catalogue est vide.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[250] bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-rose-50/30">
                <h3 className="text-2xl font-serif font-bold text-gray-900">Nouveau Don</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-xl transition-all"><X /></button>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Titre de la ressource</label>
                  <input 
                    value={newResource.title} 
                    onChange={e => setNewResource({...newResource, title: e.target.value})} 
                    className="w-full bg-gray-50 p-5 rounded-2xl outline-none font-bold focus:bg-white border border-transparent focus:border-rose-100 transition-all" 
                    placeholder="Ex: Sac de riz, Outils de bricolage..." 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Description</label>
                  <textarea 
                    value={newResource.description} 
                    onChange={e => setNewResource({...newResource, description: e.target.value})} 
                    className="w-full h-32 bg-gray-50 p-5 rounded-2xl outline-none font-medium resize-none focus:bg-white border border-transparent focus:border-rose-100 transition-all" 
                    placeholder="Détaillez l'état et la disponibilité..." 
                  />
                </div>
                <button 
                  onClick={handleCreate} 
                  className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                >
                  Publier dans la Cité
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResourceExchange;
