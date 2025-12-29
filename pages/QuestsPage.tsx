
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Target, Users, Zap, MapPin, Calendar, ArrowRight, Sparkles, Loader2, 
  ChevronRight, ShieldCheck, Flag, Flame, Star, CheckCircle2, Camera, X, 
  ShieldAlert, AlertCircle, Plus, Send, Check, BadgeCheck, Building2
} from 'lucide-react';
import { Quest, CircleType, UserCategory } from '../types';
import { CIRCLES_CONFIG } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyQuestAction } from '../lib/gemini';
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
        .select('*, profiles:proposer_id(name, avatar_url), certifiers:certifier_id(name, category)')
        .order('created_at', { ascending: false });
      if (data) setQuests(data);
    }
    setLoading(false);
  };

  const handleInvokeVision = async () => {
    setIsGenerating(true);
    try {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) await (window as any).aistudio.openSelectKey();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Génère une proposition de quête citoyenne innovante pour la Côte d'Ivoire. Format JSON: title, description, rewardXP, targetGoal, location, circleType (choisir parmi les types de cercles existants).",
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
    } catch (e) {
      console.error(e);
      addToast("Échec de l'invocation. Vérifiez votre clé API.", "error");
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
        addToast("Proposition soumise au Conseil du Gardien !", "success");
        setIsModalOpen(false);
        fetchQuests();
      }
    } else {
      addToast("Mode démo : Proposition simulée.", "info");
      setIsModalOpen(false);
    }
  };

  const handleCertify = async (questId: string) => {
    if (!user || user.category === UserCategory.CITIZEN || !supabase) return;
    const { error } = await supabase
      .from('quests')
      .update({ status: 'certified', certifier_id: user.id })
      .eq('id', questId);
    
    if (!error) {
      addToast("Sentier certifié par votre institution !", "success");
      fetchQuests();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Les Sentiers d'Impact</h1>
          <p className="text-gray-500 text-lg max-w-xl">Actions concrètes pour transformer le territoire.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
          >
            <Plus size={18} /> Proposer un Impact
          </button>
          <button 
            onClick={handleInvokeVision}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl flex items-center gap-3"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={18} className="text-amber-300" />}
            Invoquer une Vision IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Cercles Thématiques</h3>
              <div className="space-y-2">
                <button onClick={() => setFilter('all')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>Tous les Sentiers</button>
                {CIRCLES_CONFIG.map(c => (
                  <button key={c.type} onClick={() => setFilter(c.type)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${filter === c.type ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>{c.type}</button>
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
        <div className="fixed inset-0 z-[200] bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in duration-300 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X /></button>
              <h2 className="text-3xl font-serif font-bold mb-8">Proposition d'Impact</h2>
              <div className="space-y-5">
                 <input value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} placeholder="Titre de l'action..." className="w-full bg-gray-50 p-5 rounded-2xl border-none outline-none font-bold" />
                 <textarea value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} placeholder="Description détaillée..." className="w-full h-32 bg-gray-50 p-5 rounded-2xl border-none outline-none font-medium resize-none" />
                 <div className="grid grid-cols-2 gap-4">
                    <input value={newQuest.location} onChange={e => setNewQuest({...newQuest, location: e.target.value})} placeholder="Localité (Ville/Quartier)" className="bg-gray-50 p-5 rounded-2xl border-none outline-none font-bold" />
                    <select value={newQuest.circleType} onChange={e => setNewQuest({...newQuest, circleType: e.target.value as any})} className="bg-gray-50 p-5 rounded-2xl border-none outline-none font-bold text-gray-500">
                       {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
                    </select>
                 </div>
                 <button onClick={handlePropose} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Soumettre au Conseil</button>
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

  return (
    <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm hover:shadow-xl transition-all flex flex-col relative overflow-hidden">
       <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-2">
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
              quest.status === 'pending' ? 'bg-amber-100 text-amber-600 border-amber-200' :
              quest.status === 'validated' ? 'bg-blue-100 text-blue-600 border-blue-200' :
              'bg-emerald-100 text-emerald-600 border-emerald-200'
            } border`}>
              {quest.status === 'pending' ? 'En attente Conseil' : 
               quest.status === 'validated' ? 'Validé Conseil' : 'Certifié Institution'}
            </span>
            {quest.certifiers && (
               <div className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-600">
                  <BadgeCheck size={12} /> {quest.certifiers.name}
               </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 font-black text-xs">
             <Zap size={14} fill="currentColor" /> +{quest.reward_xp}
          </div>
       </div>

       <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 leading-tight">{quest.title}</h3>
       <p className="text-gray-500 text-xs leading-relaxed mb-8 flex-grow line-clamp-3">{quest.description}</p>

       <div className="pt-6 border-t border-gray-50 space-y-4">
          <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
             <div className="flex items-center gap-2"><MapPin size={12} /> {quest.location}</div>
             <div className="flex items-center gap-2"><Users size={12} /> {quest.participants_count} Engagés</div>
          </div>
          
          {canCertify ? (
            <button onClick={onCertify} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
              <Building2 size={16} /> Certifier l'Ancrage
            </button>
          ) : quest.status === 'validated' || quest.status === 'certified' ? (
            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl">
               Rejoindre la Mission
            </button>
          ) : (
            <div className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center italic border border-gray-100">
               Étude du Conseil en cours...
            </div>
          )}
       </div>
    </div>
  );
};

export default QuestsPage;
