
import React, { useState, useEffect } from 'react';
// @ts-ignore
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

interface RIC extends Edict {
  category: 'internal' | 'national';
}

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
        addToast("RIC : Vote déjà enregistré.", "error");
      } else {
        await supabase.rpc('increment_edict_votes', { row_id: ric.id });
        setHasVoted(true);
        onVote();
        addToast("Sceau citoyen apposé !", "success");
      }
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
    </div>
  );
};

const GovernancePage: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const [rics, setRics] = useState<RIC[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [newRicType, setNewRicType] = useState<'internal' | 'national'>('national');
  const [rawContent, setRawContent] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [suggestion, setSuggestion] = useState<{title: string, content: string} | null>(null);

  const fetchRics = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('edicts').select('*').order('created_at', { ascending: false });
        if (data) setRics(data as any);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRics(); }, []);

  const handleGuardianRewrite = async () => {
    if (!rawContent.trim() || isRewriting) return;
    setIsRewriting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Tu es le Gardien du Cercle Citoyen. Réécris ce RIC: "${rawContent}". Réponds uniquement en JSON {title, content}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { title: { type: Type.STRING }, content: { type: Type.STRING } },
            required: ['title', 'content']
          }
        }
      });
      setSuggestion(JSON.parse(response.text || '{}'));
      addToast("Le Gardien a structuré votre vision.", "success");
    } catch (e) { addToast("Erreur IA.", "error"); } finally { setIsRewriting(false); }
  };

  const handleSubmitRic = async (finalTitle: string, finalContent: string) => {
    if (submitting || !isRealSupabase) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('edicts').insert([{
        title: finalTitle,
        description: finalContent,
        proposer_id: user.id,
        category: newRicType,
        status: 'voting',
        votes_count: 0,
        threshold: newRicType === 'internal' ? 1000 : 10000,
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]);
      if (error) throw error;
      addToast("Initiative scellée !", "success");
      setRawContent('');
      setSuggestion(null);
      fetchRics();
    } catch (e) { addToast("Erreur de scellage.", "error"); } finally { setSubmitting(false); }
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
          <Gavel className="w-8 h-8 relative z-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Référendum d'Initiative Citoyenne</h1>
      </div>

      <section className="mb-24">
        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-xl p-10 md:p-14">
           <h2 className="text-3xl font-serif font-bold text-gray-950 mb-8">Forge de l'Initiative</h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <textarea value={rawContent} onChange={e => setRawContent(e.target.value)} placeholder="Votre proposition..." className="w-full h-72 bg-[#fdfaf5] p-8 rounded-[2.5rem] text-lg outline-none" />
              <div className="flex flex-col justify-center gap-6">
                {suggestion ? (
                  <div className="p-8 border-2 border-amber-100 rounded-[2.5rem]">
                    <h3 className="font-bold mb-4">{suggestion.title}</h3>
                    <button onClick={() => handleSubmitRic(suggestion.title, suggestion.content)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase">Adopter et Signer</button>
                  </div>
                ) : (
                  <button onClick={handleGuardianRewrite} className="bg-gray-950 text-white py-6 rounded-2xl font-black uppercase flex items-center justify-center gap-3"><BrainCircuit /> Invoquer le Gardien</button>
                )}
              </div>
           </div>
        </div>
      </section>

      <div className="space-y-12">
        {loading ? <Loader2 className="animate-spin mx-auto" /> : rics.length > 0 ? rics.map(ric => <RICCard key={ric.id} ric={ric} user={user} onVote={fetchRics} />) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-50">
             <AlertCircle className="w-16 h-16 text-gray-100 mx-auto mb-6" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucune initiative en récolte actuellement.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernancePage;
