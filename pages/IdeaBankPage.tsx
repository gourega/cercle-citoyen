
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Sparkles, Handshake, Loader2, Plus, Zap, ShieldCheck, X, ChevronLeft, Rocket, MessageSquare, Target } from 'lucide-react';
import { Idea, CircleType, User } from '../types';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { analyzeIdeaImpact } from '../lib/gemini.ts';
import { useToast } from '../ToastContext.tsx';

const MOCK_IDEAS = [
  {
    id: 'i1',
    title: 'Application de Tutorat Local',
    description: 'Une plateforme pour connecter les étudiants universitaires avec des élèves du primaire pour du soutien scolaire gratuit.',
    status: 'incubating',
    vouch_count: 42,
    created_at: new Date().toISOString(),
    author: { name: 'Amadou K.', avatar_url: 'https://picsum.photos/seed/amadou/150/150' }
  },
  {
    id: 'i2',
    title: 'Compostage de Quartier',
    description: 'Installer des bacs de compostage collectif dans chaque secteur pour réduire les déchets ménagers et nourrir les espaces verts.',
    status: 'spark',
    vouch_count: 12,
    created_at: new Date().toISOString(),
    author: { name: 'Citoyen', avatar_url: 'https://picsum.photos/seed/cit/150/150' }
  },
  {
    id: 'i3',
    title: 'Bibliothèque de Rue Souveraine',
    description: 'Transformation de cabines téléphoniques inutilisées en points d\'échange de livres en libre-service.',
    status: 'spark',
    vouch_count: 8,
    created_at: new Date().toISOString(),
    author: { name: 'Citoyen', avatar_url: 'https://picsum.photos/seed/cit2/150/150' }
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

const IdeaCard: React.FC<{ idea: any }> = ({ idea }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all relative flex flex-col group overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
        <Lightbulb size={80} />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
          idea.status === 'spark' 
            ? 'bg-yellow-50 text-yellow-600 border-yellow-100' 
            : 'bg-blue-50 text-blue-600 border-blue-100'
        }`}>
           {idea.status === 'spark' ? 'Étincelle' : 'En Incubation'}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Link to={`/profile/${idea.author_id}`} className="flex items-center gap-2 group/author">
          <img src={idea.author?.avatar_url || `https://picsum.photos/seed/${idea.author_id}/50/50`} className="w-6 h-6 rounded-lg object-cover shadow-sm" alt="" />
          <span className="text-[10px] font-bold text-gray-900 group-hover/author:text-blue-600 transition-colors">{idea.author?.name || "Citoyen"}</span>
        </Link>
      </div>
      
      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">{idea.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow line-clamp-3">{idea.description}</p>
      
      <div className="pt-6 border-t border-gray-50 mt-auto flex justify-between items-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
           {new Date(idea.created_at).toLocaleDateString()}
        </p>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase text-yellow-600 hover:scale-105 transition-transform">
           <Zap size={14} fill="currentColor" /> {idea.vouch_count} Soutiens
        </button>
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

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase
          .from('ideas')
          .select('*, author:author_id(name, avatar_url)')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setIdeas(data);
        } else {
          setIdeas(MOCK_IDEAS);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        setIdeas(MOCK_IDEAS);
      }
    } catch (e) {
      setIdeas(MOCK_IDEAS);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdea = async () => {
    if (!newIdea.title.trim()) return;
    setCreating(true);
    
    try {
      if (isRealSupabase && supabase) {
        const { data: { user } } = await (supabase.auth as any).getUser();
        if (!user) throw new Error("Non connecté");

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
        if (error) throw error;
      } else {
        const mockNew = {
          id: Date.now().toString(),
          title: newIdea.title,
          description: newIdea.description,
          status: 'spark',
          vouch_count: 1,
          created_at: new Date().toISOString(),
          author: { name: 'Moi', avatar_url: 'https://picsum.photos/seed/me/150/150' }
        };
        setIdeas(prev => [mockNew, ...prev]);
      }

      addToast("Votre idée a été propulsée !", "success");
      setIsModalOpen(false);
      setNewIdea({ title: '', description: '' });
      if (isRealSupabase) fetchIdeas();
    } catch (e) {
      addToast("Erreur lors de la publication.", "error");
    } finally {
      setCreating(false);
    }
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
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">La Banque des <span className="text-yellow-500 italic">Idées</span></h1>
          <p className="text-gray-500 max-w-xl text-lg font-medium leading-relaxed">
            Le laboratoire d'audace du Cercle. Déposez une vision, trouvez des alliés et transformez l'impossible en projet concret.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3"
        >
          <Plus size={20} /> Propulser mon Idée
        </button>
      </div>

      {/* SECTION EXPLICATIVE : LE PARCOURS DE L'INNOVATION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <StepCard 
          icon={<Sparkles className="text-yellow-500" />}
          title="1. L'Étincelle"
          text="Partagez une intuition ou une solution à un problème local. C'est le début de l'onde."
          color="border-yellow-100 bg-yellow-50/20"
        />
        <StepCard 
          icon={<Zap className="text-blue-500" />}
          title="2. L'Incubation"
          text="La communauté apporte ses soutiens (Vouches). L'idée gagne en maturité et en ressources."
          color="border-blue-100 bg-blue-50/20"
        />
        <StepCard 
          icon={<Rocket className="text-emerald-500" />}
          title="3. La Réalisation"
          text="Une fois l'équipe et les besoins réunis, l'idée devient une Quête officielle de la Cité."
          color="border-emerald-100 bg-emerald-50/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="animate-spin text-yellow-600 w-12 h-12" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ideas.length > 0 ? (
            ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-50">
               <Lightbulb className="w-16 h-16 text-gray-100 mx-auto mb-6" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucune étincelle pour le moment.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[250] bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-yellow-50/30">
              <h2 className="text-2xl font-serif font-bold text-gray-900">Propulser une Idée</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-xl transition-all"><X /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Titre de votre vision</label>
                <input 
                  value={newIdea.title}
                  onChange={e => setNewIdea({...newIdea, title: e.target.value})}
                  className="w-full bg-gray-50 p-5 rounded-2xl outline-none font-bold border border-transparent focus:bg-white focus:border-yellow-200 transition-all"
                  placeholder="Ex: Système de bus scolaire local..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Description détaillée</label>
                <textarea 
                  value={newIdea.description}
                  onChange={e => setNewIdea({...newIdea, description: e.target.value})}
                  className="w-full h-40 bg-gray-50 p-5 rounded-2xl outline-none font-medium resize-none border border-transparent focus:bg-white focus:border-yellow-200 transition-all"
                  placeholder="Quel problème résolvez-vous ? Comment la communauté peut-elle aider ?"
                />
              </div>
              <button 
                onClick={handleCreateIdea}
                disabled={creating || !newIdea.title.trim()}
                className="w-full bg-yellow-500 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {creating ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
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
