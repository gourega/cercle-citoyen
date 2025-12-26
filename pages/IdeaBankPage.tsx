
import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, Handshake, Loader2, Plus, Zap, ShieldCheck, X } from 'lucide-react';
import { Idea, CircleType, User } from '../types';
import { supabase } from '../lib/supabase';
import { analyzeIdeaImpact } from '../lib/gemini';

const IdeaCard: React.FC<{ idea: any }> = ({ idea }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all relative flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-600 border border-yellow-100">
           {idea.status === 'spark' ? 'Étincelle' : 'En Incubation'}
        </span>
      </div>
      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">{idea.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">{idea.description}</p>
      <div className="pt-6 border-t border-gray-50 mt-auto flex justify-between items-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
           {new Date(idea.created_at).toLocaleDateString()}
        </p>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase text-yellow-600">
           <Zap size={14} /> {idea.vouch_count} Soutiens
        </button>
      </div>
    </div>
  );
};

const IdeaBankPage: React.FC = () => {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });
    if (data) setIdeas(data);
    setLoading(false);
  };

  const handleCreateIdea = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const analysis = await analyzeIdeaImpact(newIdea.title, newIdea.description);
    const { error } = await supabase.from('ideas').insert([
      {
        author_id: user.id,
        title: newIdea.title,
        description: newIdea.description,
        circle_type: CircleType.IDEAS,
        needs: analysis.neededExpertises || []
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setNewIdea({ title: '', description: '' });
      fetchIdeas();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-16">
        <h1 className="text-5xl font-serif font-bold text-gray-900">Banque des <span className="text-yellow-500 italic">Idées</span></h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3"
        >
          <Plus size={20} /> Propulser mon idée
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 animate-in zoom-in duration-300">
            <h2 className="text-3xl font-serif font-bold mb-8">Propulser une Idée</h2>
            <div className="space-y-6">
              <input 
                value={newIdea.title}
                onChange={e => setNewIdea({...newIdea, title: e.target.value})}
                className="w-full bg-gray-50 p-6 rounded-2xl outline-none font-bold"
                placeholder="Titre de votre vision..."
              />
              <textarea 
                value={newIdea.description}
                onChange={e => setNewIdea({...newIdea, description: e.target.value})}
                className="w-full h-40 bg-gray-50 p-6 rounded-2xl outline-none font-medium resize-none"
                placeholder="Décrivez votre projet..."
              />
              <button 
                onClick={handleCreateIdea}
                className="w-full bg-yellow-500 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Confier au Cercle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaBankPage;
