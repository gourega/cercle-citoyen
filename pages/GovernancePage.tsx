
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gavel, 
  Sparkles, 
  Loader2, 
  Vote as VoteIcon,
  CheckCircle2,
  X,
  ChevronLeft,
  AlertCircle,
  PenTool,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Landmark,
  Shield,
  FileText,
  PenLine,
  History,
  Scale,
  BrainCircuit,
  CornerDownRight,
  Check
} from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { Edict, User } from '../types.ts';
import { useToast } from '../ToastContext.tsx';
import { GoogleGenAI, Type } from "@google/genai";

// On étend localement le type Edict pour inclure la catégorie du RIC
interface RIC extends Edict {
  category: 'internal' | 'national';
}

const MOCK_RICS: RIC[] = [
  {
    id: 'ric-1',
    title: "RIC INTERNE : Limitation des mandats des Gardiens",
    proposer_id: 'u1',
    description: "Proposition visant à limiter la durée de la fonction de Gardien à 2 ans non renouvelables pour assurer une rotation démocratique et éviter toute concentration de pouvoir numérique.",
    status: 'voting',
    category: 'internal',
    votes_count: 850,
    threshold: 1200,
    ends_at: new Date(Date.now() + 864000000).toISOString()
  },
  {
    id: 'ric-2',
    title: "RIC NATIONAL : Gratuité de la carte d'identité pour les primo-demandeurs",
    proposer_id: 'u2',
    description: "Initiative visant à interpeller le gouvernement pour la gratuité totale de la première CNI pour tous les jeunes ivoiriens atteignant 18 ans, afin de garantir leur citoyenneté pleine et entière.",
    status: 'voting',
    category: 'national',
    votes_count: 4500,
    threshold: 10000,
    ends_at: new Date(Date.now() + 1264000000).toISOString()
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

const RICCard: React.FC<{ ric: RIC, user: User, onVote: () => void }> = ({ ric, user, onVote }) => {
  const { addToast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const progress = (ric.votes_count / ric.threshold) * 100;

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!isRealSupabase || !supabase) return;
      const { data } = await supabase.from('votes').select('*').eq('edict_id', ric.id).eq('user_id', user.id).maybeSingle();
      if (data) setHasVoted(true);
    };
    checkVoteStatus();
  }, [ric.id, user.id]);

  const handleVote = async () => {
    if (hasVoted || voting) return;
    setVoting(true);
    
    if (isRealSupabase && supabase) {
      const { error: voteError } = await supabase.from('votes').insert([{ user_id: user.id, edict_id: ric.id }]);
      if (voteError) {
        addToast("RIC : Vote déjà enregistré ou erreur serveur.", "error");
      } else {
        await supabase.rpc('increment_edict_votes', { row_id: ric.id });
        setHasVoted(true);
        onVote();
        addToast("Sceau citoyen apposé !", "success");
      }
    } else {
      setHasVoted(true);
      onVote();
      addToast("Mode démo : Vote simulé.", "success");
    }
    setVoting(false);
  };

  return (
    <div className={`bg-white border-2 rounded-[3rem] p-8 md:p-10 transition-all ${ric.status === 'enacted' ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-100 hover:border-blue-100 shadow-sm'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
             {ric.category === 'internal' ? (
               <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase px-2 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                 <Shield size={10} /> RIC Interne (Gouvernance)
               </span>
             ) : (
               <span className="bg-orange-50 text-orange-600 text-[8px] font-black uppercase px-2 py-1 rounded-lg border border-orange-100 flex items-center gap-1">
                 <Landmark size={10} /> RIC National (Plaidoyer)
               </span>
             )}
          </div>
          <h3 className="text-2xl font-serif font-bold text-gray-900 leading-tight flex-1">{ric.title}</h3>
        </div>
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 ${ric.status === 'voting' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
          {ric.status === 'voting' ? 'Récolte de Signatures' : 'Adopté'}
        </span>
      </div>
      
      <p className="text-gray-600 leading-relaxed mb-10 font-medium text-sm md:text-base">
        {ric.description}
      </p>

      <div className="space-y-4">
        <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
          <span className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> {ric.votes_count.toLocaleString()} signatures</span>
          <span>Seuil : {ric.threshold.toLocaleString()}</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
          <div className={`h-full transition-all duration-1000 ${ric.status === 'enacted' ? 'bg-emerald-50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-blue-600'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
      </div>

      {ric.status === 'voting' && (
        <button 
          onClick={handleVote}
          disabled={hasVoted || voting}
          className={`w-full mt-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${hasVoted ? 'bg-emerald-50 text-white shadow-lg' : 'bg-gray-900 text-white hover:bg-black shadow-xl active:scale-95'}`}
        >
          {voting ? <Loader2 className="animate-spin" /> : hasVoted ? <CheckCircle2 className="w-5 h-5" /> : <PenTool className="w-5 h-5 text-amber-500" />}
          {hasVoted ? 'Signature Apposée' : 'Signer le RIC'}
        </button>
      )}

      {ric.status === 'enacted' && (
        <div className="mt-8 flex items-center gap-3 text-emerald-600 font-bold text-[10px] uppercase tracking-widest bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
          <ShieldCheck size={18} /> Ce référendum a abouti. La volonté citoyenne prévaut.
        </div>
      )}
    </div>
  );
};

const GovernancePage: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const [rics, setRics] = useState<RIC[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // États de la Forge
  const [newRicType, setNewRicType] = useState<'internal' | 'national'>('national');
  const [rawContent, setRawContent] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [suggestion, setSuggestion] = useState<{title: string, content: string} | null>(null);

  const fetchRics = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('edicts').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setRics(data as any);
        } else {
          setRics(MOCK_RICS);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        setRics(MOCK_RICS);
      }
    } catch (e) {
      setRics(MOCK_RICS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRics();
  }, []);

  const handleGuardianRewrite = async () => {
    if (!rawContent.trim() || isRewriting) return;
    setIsRewriting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Tu es le Gardien du Cercle Citoyen. Ta mission est de réécrire une proposition citoyenne (RIC) pour lui donner une forme structurée, solennelle et juridique, tout en restant accessible.
        Type de RIC: ${newRicType === 'internal' ? 'Interne (Règles du réseau)' : 'National (Plaidoyer pays)'}.
        Proposition brute: "${rawContent}".
        Réponds uniquement en JSON avec les champs 'title' (un titre percutant et noble) et 'content' (le corps de l'édit structuré).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ['title', 'content']
          }
        }
      });
      
      const res = JSON.parse(response.text || '{}');
      setSuggestion(res);
      addToast("Le Gardien a structuré votre vision.", "success");
    } catch (e) {
      addToast("La sagesse du Gardien est momentanément indisponible.", "error");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleSubmitRic = async (finalTitle: string, finalContent: string) => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('edicts').insert([{
          title: finalTitle,
          description: finalContent,
          proposer_id: user.id,
          category: newRicType,
          status: 'voting',
          votes_count: 0,
          threshold: newRicType === 'internal' ? 1000 : 10000,
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
        }]);

        if (error) throw error;
        await fetchRics();
      } else {
        // Mode simulation
        const newRic: RIC = {
          id: Date.now().toString(),
          title: finalTitle,
          description: finalContent,
          proposer_id: user.id,
          status: 'voting',
          category: newRicType,
          votes_count: 1,
          threshold: newRicType === 'internal' ? 1000 : 10000,
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        setRics(prev => [newRic, ...prev]);
      }

      addToast("Initiative scellée ! Récolte de signatures ouverte.", "success");
      setRawContent('');
      setSuggestion(null);
    } catch (e: any) {
      addToast("Erreur lors du scellage de l'initiative.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="mb-8">
        <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour Agora
        </Link>
      </div>
      
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-gray-950 text-orange-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
          <div className="absolute inset-0 bg-orange-500/10 rounded-[2.5rem] animate-pulse"></div>
          <Gavel className="w-8 h-8 relative z-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Référendum d'Initiative Citoyenne</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed italic">
          "Le pouvoir de la cité, par la volonté de ses citoyens." <br/>
          Une première en Côte d'Ivoire : proposez, signez, et faites changer les règles.
        </p>
      </div>

      {/* SECTION EXPLICATIVE : LE CYCLE DU RIC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <StepCard 
          icon={<FileText className="text-indigo-500" />}
          title="1. Initiative"
          text="Tout citoyen peut lancer une pétition RIC pour la vie du Cercle ou pour la Nation."
          color="border-indigo-100 bg-indigo-50/20"
        />
        <StepCard 
          icon={<PenTool className="text-orange-500" />}
          title="2. Soutien (Signatures)"
          text="Chaque citoyen signe pour valider la proposition. Si le seuil est atteint, le scrutin s'ouvre."
          color="border-orange-100 bg-orange-50/20"
        />
        <StepCard 
          icon={<ShieldCheck className="text-emerald-500" />}
          title="3. Décision"
          text="Une proposition adoptée devient une règle pour le Cercle ou un plaidoyer officiel national."
          color="border-emerald-100 bg-emerald-50/20"
        />
      </div>

      {/* FORGE DE L'INITIATIVE */}
      <section className="mb-24">
        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-xl overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform"><Scale size={200} /></div>
           
           <div className="p-10 md:p-14">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                 <div>
                    <h2 className="text-3xl font-serif font-bold text-gray-950 mb-2">Forge de l'Initiative</h2>
                    <p className="text-gray-400 font-medium italic">Façonnez ici votre proposition pour la Cité.</p>
                 </div>
                 
                 <div className="flex bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <button 
                      onClick={() => setNewRicType('internal')}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newRicType === 'internal' ? 'bg-white text-indigo-600 shadow-md border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      RIC Interne
                    </button>
                    <button 
                      onClick={() => setNewRicType('national')}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newRicType === 'national' ? 'bg-white text-orange-600 shadow-md border border-orange-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      RIC National
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <div className="relative">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-4 block">Ma proposition brute</label>
                       <textarea 
                         value={rawContent}
                         onChange={(e) => setRawContent(e.target.value)}
                         placeholder="Ex: Je propose que chaque quartier ait une bibliothèque citoyenne auto-gérée..."
                         className="w-full h-72 bg-[#fdfaf5] border-2 border-amber-50 p-8 rounded-[2.5rem] text-lg font-medium text-gray-800 outline-none focus:bg-white focus:border-amber-100 transition-all shadow-inner leading-relaxed placeholder:text-gray-300"
                       />
                       <div className="absolute bottom-6 right-6 flex gap-2">
                          <button 
                            onClick={handleGuardianRewrite}
                            disabled={!rawContent.trim() || isRewriting}
                            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-xl disabled:opacity-30"
                          >
                            {isRewriting ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} className="text-amber-500" />}
                            Plume du Gardien
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="relative">
                    {suggestion ? (
                      <div className="bg-white border-2 border-amber-100 rounded-[2.5rem] p-10 h-full animate-in slide-in-from-right-4 flex flex-col">
                         <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><Sparkles size={18} /></div>
                            <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Écho du Gardien</h4>
                         </div>
                         <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">{suggestion.title}</h3>
                         <div className="text-gray-600 leading-relaxed font-medium text-sm flex-1 overflow-y-auto pr-4 mb-8 custom-scrollbar">
                            {suggestion.content}
                         </div>
                         <div className="flex gap-4">
                            <button 
                              onClick={() => handleSubmitRic(suggestion.title, suggestion.content)}
                              disabled={submitting}
                              className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                            >
                              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                              Adopter l'Écho
                            </button>
                            <button 
                              onClick={() => setSuggestion(null)}
                              className="px-6 py-5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all"
                            >
                              <X size={18} />
                            </button>
                         </div>
                      </div>
                    ) : (
                      <div className="h-full border-4 border-dashed border-gray-50 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 group-hover:border-amber-100 transition-colors">
                         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200 group-hover:text-amber-200 transition-colors">
                            <FileText size={32} />
                         </div>
                         <h4 className="text-gray-400 font-bold mb-2">Prêt à sceller votre vision</h4>
                         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest max-w-[200px]">Invoquez le Gardien pour structurer votre initiative</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-[3rem] bg-indigo-50/50 border border-indigo-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
            <Shield size={32} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-gray-900">RIC Interne</h3>
            <p className="text-xs text-indigo-700/60 font-medium">Réforme de la gouvernance, des règles et de l'éthique au sein du Cercle Citoyen.</p>
          </div>
        </div>
        <div className="p-8 rounded-[3rem] bg-orange-50/50 border border-orange-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-600">
            <Landmark size={32} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-gray-900">RIC National</h3>
            <p className="text-xs text-orange-700/60 font-medium">Propositions de lois et plaidoyers pour influencer les politiques publiques de la Côte d'Ivoire.</p>
          </div>
        </div>
      </div>

      <div className="mb-12 flex items-center justify-between border-b border-gray-100 pb-6 px-4">
        <h2 className="text-xl font-serif font-bold text-gray-900">Signatures en cours</h2>
        <div className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em] flex items-center gap-2">
          <Zap size={14} className="text-orange-500" /> Mode Démocratie Directe
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {rics.length > 0 ? (
            rics.map(ric => (
              <RICCard key={ric.id} ric={ric} user={user} onVote={fetchRics} />
            ))
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-50 shadow-inner">
               <AlertCircle className="w-16 h-16 text-gray-100 mx-auto mb-6" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">Aucune initiative en récolte actuellement.</p>
               <Link to="/ideas" className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:underline">
                  Transformer une idée en RIC <ArrowRight size={14} />
               </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GovernancePage;
