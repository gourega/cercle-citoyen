
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Handshake, Plus, Search, Loader2, Package, Sparkles, Heart, ArrowRight, X, CheckCircle2, ShoppingBag, ChevronLeft, ShieldCheck, Zap } from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { User, ResourceGift } from '../types.ts';
import { useToast } from '../ToastContext.tsx';

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
    <div className="flex justify-between items-start mb-6">
      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${resource.status === 'available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
        {resource.status === 'available' ? 'Disponible' : 'Réclamé'}
      </span>
    </div>
    <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">{resource.title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow line-clamp-2">{resource.description}</p>
  </div>
);

const ResourceExchange: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const [resources, setResources] = useState<ResourceGift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('resource_gifts').select('*').order('created_at', { ascending: false });
        if (data) setResources(data);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-16">Le Marché de Solidarité</h1>
      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.length > 0 ? resources.map(res => <ResourceCard key={res.id} resource={res} onClaim={() => {}} />) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-50">
               <ShoppingBag className="w-16 h-16 text-gray-100 mx-auto mb-6" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Le catalogue est vide.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceExchange;
