
import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  ImageIcon,
  Camera,
  Trash2,
  BookOpen,
  ListOrdered,
  Lightbulb,
  Info,
  Type,
  Bold,
  Italic,
  List as ListIcon,
  Quote
} from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { Edict, User } from '../types.ts';
import { useToast } from '../ToastContext.tsx';

interface RIC extends Edict {
  category: 'internal' | 'national';
}

const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
    reader.onerror = reject;
  });
};

// Processeur de contenu Markdown pour les édits
const formatContent = (text: string) => {
  if (!text) return text;
  return text.split('\n').map((line, i) => {
    let formattedLine = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>');
    
    // Support simple pour les listes
    if (formattedLine.trim().startsWith('- ')) {
      formattedLine = `<span class="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2"></span>` + formattedLine.replace('- ', '');
    }

    return <span key={i} className="block mb-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
  });
};

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
    <div className={`bg-white border-2 rounded-[3.5rem] overflow-hidden transition-all duration-500 group ${ric.status === 'enacted' ? 'border-emerald-100 bg-emerald-50/10 shadow-emerald-50' : 'border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-xl'}`}>
      <div className="p-8 md:p-12 flex flex-col">
        {/* Header : Titre & Catégorie */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
               {ric.category === 'internal' ? (
                 <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase px-2 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                   <Shield size={10} /> RIC Interne
                 </span>
               ) : (
                 <span className="bg-orange-50 text-orange-600 text-[8px] font-black uppercase px-2 py-1 rounded-lg border border-orange-100 flex items-center gap-1">
                   <Landmark size={10} /> RIC National
                 </span>
               )}
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight tracking-tight">{ric.title}</h3>
          </div>
          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 shadow-sm border ${ric.status === 'voting' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
            {ric.status === 'voting' ? 'En Récolte' : 'Adopté'}
          </span>
        </div>
        
        {/* Corps : Description avec rendu Markdown */}
        <div className="text-gray-600 leading-relaxed mb-10 font-medium text-base md:text-lg max-w-4xl">
          {formatContent(ric.description)}
        </div>

        {/* Illustration : PLACÉE JUSTE SOUS LE TEXTE */}
        {ric.image_url && (
          <div className="mb-12 rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group/img relative aspect-[21/9]">
            <img 
              src={ric.image_url} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              alt="Illustration de l'initiative" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </div>
        )}

        {/* Footer : Stats & Vote */}
        <div className="mt-auto space-y-8 bg-gray-50/50 -mx-8 -mb-12 p-8 md:p-12 border-t border-gray-100">
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
              <span className="flex items-center gap-2">
                <Users size={16} className="text-blue-600" /> 
                <span className="text-gray-900">{ric.votes_count.toLocaleString()}</span> citoyens engagés
              </span>
              <span>Objectif : <span className="text-gray-900">{ric.threshold.toLocaleString()}</span></span>
            </div>
            <div className="h-4 w-full bg-white rounded-full overflow-hidden shadow-inner border border-gray-100 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${ric.status === 'enacted' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'}`} 
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          {ric.status === 'voting' && (
            <button 
              onClick={handleVote}
              disabled={hasVoted || voting}
              className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${hasVoted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner' : 'bg-gray-900 text-white hover:bg-black hover:shadow-2xl shadow-xl active:scale-[0.98]'}`}
            >
              {voting ? <Loader2 className="animate-spin" /> : hasVoted ? <CheckCircle2 className="w-6 h-6" /> : <PenTool className="w-6 h-6 text-amber-500" />}
              {hasVoted ? 'SIGNATURE APPOSÉE' : 'SCELLER MON SOUTIEN'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const GovernancePage: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [rics, setRics] = useState<RIC[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [newRicType, setNewRicType] = useState<'internal' | 'national'>('national');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setSelectedImage(compressed);
        addToast("Illustration prête.", "success");
      } catch (err) {
        addToast("Erreur de traitement image.", "error");
      }
    }
  };

  const applyFormat = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    
    let newText = description.substring(0, start) + prefix + selectedText + suffix + description.substring(end);
    let newPos = start + prefix.length + selectedText.length + suffix.length;

    setDescription(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Calcul de la "Force de l'Édit"
  const calculateStrength = () => {
    let score = 0;
    if (title.length > 10) score += 20;
    if (description.length > 100) score += 30;
    if (description.includes('ARTICLE')) score += 15;
    if (description.includes('IMPACT')) score += 15;
    if (selectedImage) score += 20;
    return Math.min(score, 100);
  };

  const strength = calculateStrength();

  const getRecommendations = () => {
    const recs = [];
    if (!title) recs.push("Donnez un titre clair à votre vision.");
    if (description.length < 50) recs.push("Détaillez davantage votre proposition.");
    if (!description.includes('ARTICLE')) recs.push("Structurez en 'ARTICLES' pour plus de poids.");
    if (!description.includes('IMPACT')) recs.push("Précisez l'IMPACT ATTENDU pour les citoyens.");
    if (!selectedImage) recs.push("Une image illustre mieux le besoin réel.");
    return recs;
  };

  const handleSubmitRic = async () => {
    if (submitting || !isRealSupabase || !title || !description) return;
    setSubmitting(true);
    try {
      console.log("Tentative de scellage avec user ID:", user.id);
      
      const { data, error } = await supabase.from('edicts').insert([{
        title,
        description,
        proposer_id: user.id,
        category: newRicType,
        image_url: selectedImage,
        status: 'voting',
        votes_count: 0,
        threshold: newRicType === 'internal' ? 1000 : 10000,
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]).select();
      
      if (error) {
        console.error("ERREUR SUPABASE BRUTE:", error);
        throw new Error(error.message || "Erreur de base de données");
      }
      
      console.log("Succès du scellage:", data);
      addToast("Référendum scellé avec succès !", "success");
      setTitle('');
      setDescription('');
      setSelectedImage(null);
      fetchRics();
    } catch (e: any) { 
      console.error("CATCH ERROR:", e);
      addToast(`Échec : ${e.message || 'Vérifiez le script V8'}`, "error"); 
    } finally { setSubmitting(false); }
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
        <p className="text-gray-500 max-w-2xl mx-auto font-medium">L'espace sacré où la volonté populaire devient un édit pour la Cité.</p>
      </div>

      <section className="mb-24">
        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl p-8 md:p-14 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform"><Scale size={200} /></div>
           <h2 className="text-3xl font-serif font-bold text-gray-900 mb-10 flex items-center gap-4">
             <PenLine className="text-orange-500" /> Forge de l'Initiative
           </h2>
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
              <div className="lg:col-span-8 space-y-6">
                <input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Titre de votre édit citoyen..."
                  className="w-full bg-gray-50 p-6 rounded-2xl text-xl font-serif font-bold outline-none border-2 border-transparent focus:border-amber-100 focus:bg-white transition-all shadow-inner"
                />

                <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex items-center gap-1">
                      <button onClick={() => applyFormat("**", "**")} className="p-3 bg-white rounded-xl text-gray-500 hover:text-blue-600 transition-all shadow-sm border border-gray-100" title="Gras"><Bold size={16} /></button>
                      <button onClick={() => applyFormat("*", "*")} className="p-3 bg-white rounded-xl text-gray-500 hover:text-blue-600 transition-all shadow-sm border border-gray-100" title="Italique"><Italic size={16} /></button>
                      <button onClick={() => applyFormat("\n- ")} className="p-3 bg-white rounded-xl text-gray-500 hover:text-blue-600 transition-all shadow-sm border border-gray-100" title="Liste"><ListIcon size={16} /></button>
                      <button onClick={() => applyFormat("\n> ")} className="p-3 bg-white rounded-xl text-gray-500 hover:text-blue-600 transition-all shadow-sm border border-gray-100" title="Citation"><Quote size={16} /></button>
                   </div>
                   
                   <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                   <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      <button onClick={() => applyFormat("\nOBJET : ")} className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 hover:text-orange-600 transition-all flex items-center gap-2 shadow-sm"><Type size={14} /> Objet</button>
                      <button onClick={() => applyFormat("\nARTICLE 1 : ")} className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 hover:text-orange-600 transition-all flex items-center gap-2 shadow-sm"><ListOrdered size={14} /> Article</button>
                      <button onClick={() => applyFormat("\nIMPACT ATTENDU : ")} className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 hover:text-orange-600 transition-all flex items-center gap-2 shadow-sm"><Lightbulb size={14} /> Impact</button>
                   </div>
                </div>

                <textarea 
                  ref={textareaRef}
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Rédigez ici le corps de votre édit. Utilisez les outils ci-dessus pour structurer et mettre en forme votre proposition..." 
                  className="w-full h-96 bg-[#fdfaf5] p-8 rounded-[2.5rem] text-lg outline-none border-2 border-transparent focus:border-amber-100 focus:bg-white transition-all shadow-inner resize-none" 
                />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  {!selectedImage ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-gray-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all flex items-center justify-center gap-3"
                    >
                      <Camera size={18} /> Illustrer l'Initiative
                    </button>
                  ) : (
                    <div className="flex-1 relative h-20 rounded-2xl overflow-hidden border-2 border-orange-200">
                       <img src={selectedImage} className="w-full h-full object-cover" alt="" />
                       <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-lg shadow-lg"><X size={12} /></button>
                    </div>
                  )}
                  <select 
                    value={newRicType} 
                    onChange={e => setNewRicType(e.target.value as any)}
                    className="sm:w-48 bg-gray-50 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-gray-100 cursor-pointer"
                  >
                    <option value="national">RIC National</option>
                    <option value="internal">RIC Interne</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="bg-gray-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10"><PenTool size={100} /></div>
                   <h3 className="text-[10px] font-black uppercase text-orange-400 tracking-[0.3em] mb-6">Guide du Rédacteur</h3>
                   
                   <div className="space-y-6 mb-10">
                      <div className="flex justify-between items-end text-[10px] font-black uppercase mb-2">
                        <span>Force de l'Édit</span>
                        <span>{strength}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-700 ${strength > 70 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : strength > 40 ? 'bg-orange-500' : 'bg-rose-500'}`} style={{ width: `${strength}%` }}></div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {getRecommendations().map((rec, i) => (
                        <div key={i} className="flex gap-3 text-xs text-gray-400 font-medium animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                           <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                           {rec}
                        </div>
                      ))}
                      {getRecommendations().length === 0 && (
                        <div className="flex gap-3 text-xs text-emerald-400 font-medium italic animate-in zoom-in">
                           <CheckCircle2 size={16} /> Votre édit est prêt à être scellé.
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                   <h4 className="font-serif font-bold text-lg text-gray-900 mb-4 flex items-center gap-2"><BookOpen className="text-orange-500" size={20} /> Rappel du Sceau</h4>
                   <p className="text-xs text-gray-600 leading-relaxed font-medium italic">
                     "Tout citoyen qui propose un RIC s'engage sur l'honneur à servir le bien commun. Votre vision doit être constructive, inclusive et réalisable."
                   </p>
                </div>

                <button 
                  onClick={handleSubmitRic} 
                  disabled={submitting || !title || !description}
                  className="w-full bg-orange-600 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-orange-700 transition-all shadow-3xl disabled:opacity-30 active:scale-95 group"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck className="group-hover:scale-110 transition-transform" />} 
                  Sceller l'Initiative
                </button>
              </div>
           </div>
        </div>
      </section>

      <div className="space-y-12">
        <div className="flex items-center gap-4 mb-12 px-6">
           <Landmark className="text-blue-600" size={24} />
           <h2 className="text-3xl font-serif font-bold text-gray-900">Le Palais des Référendums</h2>
        </div>
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
        ) : rics.length > 0 ? (
          <div className="space-y-12 animate-in fade-in duration-500">
            {rics.map(ric => <RICCard key={ric.id} ric={ric} user={user} onVote={fetchRics} />)}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-50 shadow-sm">
             <AlertCircle className="w-16 h-16 text-gray-100 mx-auto mb-6" />
             <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-xs">Le Palais attend vos initiatives.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernancePage;
