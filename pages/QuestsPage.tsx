
import React, { useState, useRef } from 'react';
import { 
  Trophy, 
  Target, 
  Users, 
  Zap, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Flag,
  Flame,
  Star,
  CheckCircle2,
  Camera,
  X,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { Quest, CircleType } from '../types';
import { CIRCLES_CONFIG } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyQuestAction } from '../lib/gemini';

const MOCK_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'Bibliothèque de Quartier - Yopougon',
    description: 'Collecte et installation de 500 ouvrages pour les enfants du quartier Selmer.',
    circleType: CircleType.EDUCATION,
    difficulty: 'Initié',
    rewardXP: 450,
    currentProgress: 320,
    targetGoal: 500,
    participantsCount: 24,
    status: 'available',
    location: 'Abidjan, Yopougon',
    deadline: '15 Mars 2025',
    proposerId: 'u3'
  },
  {
    id: 'q2',
    title: 'Ceinture Verte d\'Odienné',
    description: 'Reforestation des abords des écoles pour lutter contre l\'érosion et créer de l\'ombre.',
    circleType: CircleType.AGRICULTURE,
    difficulty: 'Maître',
    rewardXP: 1200,
    currentProgress: 85,
    targetGoal: 1000,
    participantsCount: 156,
    status: 'active',
    location: 'Odienné',
    deadline: 'En cours',
    proposerId: 'u5'
  }
];

const VerificationModal: React.FC<{ quest: Quest, onClose: () => void }> = ({ quest, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{isValid: boolean, explanation: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const b64 = image.split(',')[1];
      const res = await verifyQuestAction(b64, quest.description);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
       <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
            <div>
              <h3 className="text-3xl font-serif font-bold text-gray-900">Sceller l'Action</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mt-1">Souveraineté par la Preuve</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all"><X /></button>
          </div>

          <div className="p-10">
            {!result ? (
              <div className="space-y-8">
                 <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
                    <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Téléchargez une photo prouvant votre réalisation. L'IA du Gardien analysera l'image pour valider votre impact.
                    </p>
                 </div>

                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="aspect-video bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-100 transition-all group overflow-hidden"
                 >
                    {image ? (
                      <img src={image} className="w-full h-full object-cover" alt="Preuve" />
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-200 group-hover:text-blue-400 transition-colors mb-4" />
                        <p className="text-xs font-black text-gray-400 uppercase">Prendre ou choisir une photo</p>
                      </>
                    )}
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                 <button 
                   onClick={handleVerify}
                   disabled={!image || loading}
                   className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl disabled:opacity-30"
                 >
                   {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Soumettre au Gardien"}
                 </button>
              </div>
            ) : (
              <div className="text-center py-6 animate-in fade-in zoom-in">
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${result.isValid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {result.isValid ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
                 </div>
                 <h4 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                    {result.isValid ? "Action Authentifiée !" : "Besoin de Précisions"}
                 </h4>
                 <p className="text-sm text-gray-500 leading-relaxed mb-10 px-4 italic">
                    "{result.explanation}"
                 </p>
                 <button 
                   onClick={onClose}
                   className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em]"
                 >
                    Continuer ma mission
                 </button>
              </div>
            )}
          </div>
       </div>
    </div>
  );
};

const QuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>(MOCK_QUESTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<CircleType | 'all'>('all');
  const [selectedQuestForVerification, setSelectedQuestForVerification] = useState<Quest | null>(null);

  const handleGenerateQuest = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Génère une quête citoyenne inspirante pour la Côte d'Ivoire. Format JSON: title, description, circleType, difficulty (Novice/Initié/Maître), rewardXP, targetGoal, location.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              circleType: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              rewardXP: { type: Type.NUMBER },
              targetGoal: { type: Type.NUMBER },
              location: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      const newQuest: Quest = {
        id: 'q-' + Date.now(),
        title: data.title,
        description: data.description,
        circleType: data.circleType as CircleType,
        difficulty: data.difficulty as any,
        rewardXP: data.rewardXP,
        currentProgress: 0,
        targetGoal: data.targetGoal,
        participantsCount: 1,
        status: 'available',
        location: data.location,
        proposerId: 'ai'
      };
      setQuests([newQuest, ...quests]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      {selectedQuestForVerification && (
        <VerificationModal 
          quest={selectedQuestForVerification} 
          onClose={() => setSelectedQuestForVerification(null)} 
        />
      )}
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Les Sentiers d'Impact</h1>
          <p className="text-gray-500 text-lg max-w-xl">Des actions concrètes pour transformer notre environnement et gagner en souveraineté.</p>
        </div>
        <button 
          onClick={handleGenerateQuest}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-3 group"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
          Invoquer une Vision IA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Filters Grid */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Filtrer par Cercle</h3>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setFilter('all')}
                  className={`col-span-3 text-center px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  Tous les Sentiers
                </button>
                {CIRCLES_CONFIG.map(c => (
                  <button 
                    key={c.type}
                    onClick={() => setFilter(c.type)}
                    className={`text-center px-2 py-3 rounded-xl text-[9px] font-bold leading-tight transition-all border flex items-center justify-center ${filter === c.type ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-50' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-100 hover:bg-blue-50/30'}`}
                  >
                    <span className="line-clamp-2">{c.type}</span>
                  </button>
                ))}
              </div>
           </div>
        </aside>

        {/* Quest List */}
        <main className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quests.filter(q => filter === 'all' || q.circleType === filter).map(quest => (
              <QuestCard key={quest.id} quest={quest} onVerify={() => setSelectedQuestForVerification(quest)} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

const QuestCard: React.FC<{ quest: Quest, onVerify: () => void }> = ({ quest, onVerify }) => {
  const progress = (quest.currentProgress / quest.targetGoal) * 100;
  
  return (
    <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group relative overflow-hidden flex flex-col">
       <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
          <Target size={120} />
       </div>

       <div className="flex justify-between items-start mb-6">
          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            quest.difficulty === 'Novice' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            quest.difficulty === 'Initié' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {quest.difficulty}
          </span>
          <div className="flex items-center gap-1.5 text-blue-600">
             <Zap size={14} className="fill-current" />
             <span className="text-xs font-black">+{quest.rewardXP} XP</span>
          </div>
       </div>

       <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
          {quest.title}
       </h3>
       <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
          {quest.description}
       </p>

       <div className="space-y-6">
          <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
             <div className="flex items-center gap-2">
                <Users size={14} /> {quest.participantsCount} Citoyens engagés
             </div>
             <span>{Math.round(progress)}% complété</span>
          </div>
          <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
             <div 
               className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
               style={{ width: `${progress}%` }}
             ></div>
          </div>
       </div>

       <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-2"><MapPin size={12} className="text-blue-500" /> {quest.location}</div>
          {quest.deadline && <div className="flex items-center gap-2"><Calendar size={12} className="text-amber-500" /> {quest.deadline}</div>}
       </div>

       <div className="mt-8 flex gap-3">
          <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3">
            Rejoindre <ArrowRight size={14} />
          </button>
          <button 
            onClick={onVerify}
            className="px-6 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg flex items-center justify-center"
          >
            <Camera size={18} />
          </button>
       </div>
    </div>
  );
};

export default QuestsPage;
