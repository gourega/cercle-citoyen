
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Target, Users, Zap, MapPin, Calendar, ArrowRight, Sparkles, Loader2, 
  ChevronRight, ShieldCheck, Flag, Flame, Star, CheckCircle2, Camera, X, 
  ShieldAlert, AlertCircle, Plus, Send, Check, BadgeCheck, Building2, ChevronLeft
} from 'lucide-react';
import { Quest, CircleType, UserCategory } from '../types';
import { CIRCLES_CONFIG } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase, isRealSupabase } from '../lib/supabase';
import { useToast } from '../App';

const QuestsPage: React.FC = () => {
  const { addToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CircleType | 'all'>('all');
  
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    circleType: CircleType.PEACE,
    difficulty: 'Initié',
    rewardXP: 100,
    targetGoal: 100,
    location: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('cercle_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    if (isRealSupabase && supabase) {
      const { data } = await supabase
        .from('quests')
        .select(`
          *, 
          proposer:proposer_id(name, avatar_url), 
          certifier:certifier_id(name, category),
          validator:validator_id(name)
        `)
        .order('created_at', { ascending: false });
      if (data) setQuests(data);
    }
    setLoading(false);
  };

  const handleInvokeVision = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Génère une proposition d'action citoyenne concrète, innovante et impactante pour la Côte d'Ivoire (ex: assainissement, éducation, tech, agriculture). Format JSON: title (court), description (un paragraphe mobilisant), rewardXP (nombre entre 100 et 500), targetGoal (nombre de participants cibles), location (une ville ou région ivoirienne), circleType (un des types de cercles).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              circleType: { type: Type.STRING },
              rewardXP: { type: Type.NUMBER },
              targetGoal: { type: Type.NUMBER },
              location: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setNewQuest({
        ...newQuest,
        title: data.title || '',
        description: data.description || '',
        circleType: data.circleType as CircleType || CircleType.PEACE,
        rewardXP: data.rewardXP || 100,
        targetGoal: data.targetGoal || 100,
        location: data.location || ''
      });
      setIsModalOpen(true);
      addToast("Le Gardien a tracé une vision pour vous.", "success");
    } catch (e) {
      console.error(e);
      addToast("Échec de l'invocation IA.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePropose = async () => {
    if (!newQuest.title.trim() || !user) return;
    
    if (isRealSupabase && supabase) {
      const { error } = await supabase.from('quests').insert([{
        title: newQuest.title,
        description: newQuest.description,
        circle_type: newQuest.circleType,
        difficulty: newQuest.difficulty,
        reward_xp: newQuest.rewardXP,
        target_goal: newQuest.targetGoal,
        location: newQuest.location,
        proposer_id: user.id,
        status: 'pending'
      }]);
      
      if (!error) {
        addToast("Proposition soumise pour validation au Conseil.", "success");
        setIsModalOpen(false);
        fetchQuests();
      }
    }
  };

  const handleCertify = async (questId: string) => {
    if (!user || user.category === UserCategory.CITIZEN || !supabase) return;
    const { error } = await supabase
      .from('quests')
      .update({ 
        status: 'certified', 
        certifier_id: user.id 
      })
      .eq('id', questId);
    
    if (!error) {
      addToast("Certification d'ancrage territorial effectuée !", "success");
      fetchQuests();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
        <div>
          <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-6 transition-colors text-sm font-bold group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au fil
          </Link>
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Les Sentiers d'Impact</h1>
          <p className="text-gray-500 text-lg max-w-xl">Actions concrètes pour transformer le territoire et gagner en souveraineté.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={handleInvokeVision}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={18} className="text-amber-300" />}
            Invoquer une Vision IA
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus size={18} /> Proposer un Sentier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Filtrer par Cercle</h3>
              <div className="space-y-2">
                <button onClick={() => setFilter('all')} className={`w-full text-left px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}>Tous les Sentiers</button>
                {CIRCLES_CONFIG.map(c => (
                  <button key={c.type} onClick={() => setFilter(c.type)} className={`w-full text-left px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${filter === c.type ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}>{c.type}</button>
                ))}
              </div>
           </div>
        </aside>

        <main className="lg:col-span-9">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {quests.filter(q => filter === 'all' || q.circle_type === filter).map(q => (
                <QuestCard key={q.id} quest={q} currentUser={user} onCertify={() => handleCertify(q.id)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in duration-300 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all"><X /></button>
              <div className="mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <Target />
                </div>
                <h2 className="text-3xl font-serif font-bold text-gray-900">Nouveau Sentier</h2>
                <p className="text-xs text-gray-500 font-medium">Tracez le chemin du progrès social.</p>
              </div>
              <div className="space-y-5">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Titre de l'action</label>
                   <input value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} placeholder="Ex: Bibliothèque de Quartier - Yopougon" className="w-full bg-gray-50 p-5 rounded-[1.5rem] border border-transparent outline-none font-bold focus:bg-white focus:border-blue-100 transition-all" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Description de la mission</label>
                   <textarea value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} placeholder="Détaillez l'action et l'impact attendu..." className="w-full h-32 bg-gray-50 p-6 rounded-[1.5rem] border border-transparent outline-none font-medium resize-none focus:bg-white focus:border-blue-100 transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Localité</label>
                      <input value={newQuest.location} onChange={e => setNewQuest({...newQuest, location: e.target.value})} placeholder="Ville / Quartier" className="w-full bg-gray-50 p-5 rounded-[1.5rem] border border-transparent outline-none font-bold focus:bg-white focus:border-blue-100 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Cercle lié</label>
                      <select value={newQuest.circleType} onChange={e => setNewQuest({...newQuest, circleType: e.target.value as any})} className="w-full bg-gray-50 p-5 rounded-[1.5rem] border border-transparent outline-none font-bold text-gray-500 focus:bg-white focus:border-blue-100 transition-all">
                         {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
                      </select>
                    </div>
                 </div>
                 <button onClick={handlePropose} className="w-full bg-gray-900 text-white py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all mt-4">Soumettre au Conseil</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const QuestCard: React.FC<{ quest: any, currentUser: any, onCertify: () => void }> = ({ quest, currentUser, onCertify }) => {
  const isInstitution = currentUser?.category !== UserCategory.CITIZEN;
  const canCertify = isInstitution && quest.status === 'validated';

  const statusColors = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    validated: 'bg-blue-50 text-blue-600 border-blue-100',
    certified: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const statusLabels = {
    pending: 'En attente Validation',
    validated: 'Validé par Admin',
    certified: 'Certifié Institution',
    rejected: 'Proposition Écartée'
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm hover:shadow-xl transition-all flex flex-col relative overflow-hidden group">
       <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-2">
            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[quest.status as keyof typeof statusColors]}`}>
              {statusLabels[quest.status as keyof typeof statusLabels]}
            </span>
            {quest.certifier && (
               <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600 px-2">
                  <BadgeCheck size={14} /> Ancrage : {quest.certifier.name}
               </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs bg-blue-50 px-3 py-1.5 rounded-xl">
             <Zap size={14} fill="currentColor" /> +{quest.reward_xp} XP
          </div>
       </div>

       <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 leading-tight">{quest.title}</h3>
       <p className="text-gray-500 text-[13px] leading-relaxed mb-8 flex-grow line-clamp-3 font-medium">{quest.description}</p>

       <div className="pt-6 border-t border-gray-50 space-y-6">
          <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
             <div className="flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> {quest.location}</div>
             <div className="flex items-center gap-2"><Users size={14} /> {quest.participants_count} Citoyens</div>
          </div>
          
          <div className="space-y-3">
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(quest.current_progress / quest.target_goal) * 100}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
               <span>Progression</span>
               <span>{Math.round((quest.current_progress / quest.target_goal) * 100)}% Complété</span>
            </div>
          </div>
          
          {canCertify ? (
            <button onClick={onCertify} className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">
              <Building2 size={18} /> Certifier l'Ancrage Territorial
            </button>
          ) : quest.status === 'validated' || quest.status === 'certified' ? (
            <button className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95">
               <Flame size={18} className="text-amber-400" /> Rejoindre la Mission
            </button>
          ) : (
            <div className="py-5 bg-gray-50 text-gray-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-center italic border border-gray-100">
               Étude du Conseil en cours...
            </div>
          )}
       </div>
    </div>
  );
};

export default QuestsPage;
