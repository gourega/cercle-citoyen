
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Lightbulb, Sparkles, Handshake, Loader2, Plus, Zap, ShieldCheck, X, ChevronLeft, Rocket, MessageSquare, Target } from 'lucide-react';
import { Idea, CircleType, User } from '../types';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { analyzeIdeaImpact } from '../lib/gemini.ts';
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

const IdeaCard: React.FC<{ idea: any }> = ({ idea }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all relative flex flex-col group overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
        <Lightbulb size={80} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">En Incubation</span>
      </div>
      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">{idea.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow line-clamp-3">{idea.description}</p>
      <div className="pt-6 border-t border-gray-50 mt-auto flex justify-between items-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(idea.created_at).toLocaleDateString()}</p>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase text-yellow-600"><Zap size={14} fill="currentColor" /> {idea.vouch_count || 0} Soutiens</button>
      </div>
    </div>
  );
};

const IdeaBankPage: React.FC = () => {
  const { addToast } = useToast();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '' });

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('ideas').select('*, author:author_id(name, avatar_url)').order('created_at', { ascending: false });
        if (data) setIdeas(data);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchIdeas(); }, []);

  const handleCreateIdea = async () => {
    if (!newIdea.title.trim() || !isRealSupabase) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");
      const { error } = await supabase.from('ideas').insert([{ author_id: user.id, title: newIdea.title, description: newIdea.description, circle_type: CircleType.IDEAS }]);
      if (error) throw error;
      addToast("Votre idée a été propulsée !", "success");
      setIsModalOpen(false);
      setNewIdea({ title: '', description: '' });
      fetchIdeas();
    } catch (e) { addToast("Erreur lors de la publication.", "error"); } finally { setCreating(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">La Banque des <span className="text-yellow-500 italic">Idées</span></h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase shadow-xl flex items-center gap-3"><Plus /> Propulser mon Idée</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? <Loader2 className="animate-spin mx-auto" /> : ideas.length > 0 ? ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-50">
             <Lightbulb className="w-16 h-16 text-gray-100 mx-auto mb-6" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucune étincelle pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaBankPage;
