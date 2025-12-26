
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gavel, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  Vote as VoteIcon,
  Hourglass,
  Crown,
  History,
  Zap,
  CheckCircle2,
  X,
  Users,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Edict, User, Vote } from '../types';
import { useToast } from '../App';

const EdictModal: React.FC<{ onClose: () => void, user: User, onSuccess: () => void }> = ({ onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('edicts').insert([{
      title: formData.title,
      description: formData.description,
      proposer_id: user.id,
      status: 'voting',
      threshold: 1000,
      votes_count: 0
    }]);
    
    if (!error) {
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
          <div>
            <h3 className="text-3xl font-serif font-bold text-gray-900">Nouvel Édit</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mt-1">Législation Citoyenne Directe</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-4">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Intitulé de l'Édit</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Charte pour la Protection des Arbres Centenaires"
              className="w-full bg-gray-50 border border-transparent focus:border-blue-100 focus:bg-white py-5 px-6 rounded-2xl outline-none font-bold text-lg transition-all"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Corps de la proposition</label>
            <textarea 
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Décrivez les règles, les impacts et les bénéfices pour la cité..."
              className="w-full min-h-[200px] bg-gray-50 border border-transparent focus:border-blue-100 focus:bg-white py-5 px-6 rounded-2xl outline-none font-medium leading-relaxed transition-all resize-none"
            />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Lancer le Scrutin National"}
          </button>
        </form>
      </div>
    </div>
  );
};

const EdictCard: React.FC<{ edict: Edict, user: User, onVote: () => void }> = ({ edict, user, onVote }) => {
  const { addToast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const progress = (edict.votes_count / edict.threshold) * 100;

  useEffect(() => {
    checkVoteStatus();
  }, [edict.id, user.id]);

  const checkVoteStatus = async () => {
    const { data } = await supabase.from('votes').select('*').eq('edict_id', edict.id).eq('user_id', user.id).single();
    if (data) setHasVoted(true);
  };

  const handleVote = async () => {
    if (hasVoted || voting) return;
    setVoting(true);
    
    const { error: voteError } = await supabase.from('votes').insert([{ user_id: user.id, edict_id: edict.id }]);
    if (voteError) {
      addToast("Erreur lors du vote.", "error");
    } else {
      await supabase.rpc('increment_edict_votes', { row_id: edict.id });
      setHasVoted(true);
      onVote();
      addToast("Votre sceau citoyen a été apposé !", "success");
    }
    setVoting(false);
  };

  return (
    <div className={`bg-white border-2 rounded-[3rem] p-10 transition-all group relative overflow-hidden ${edict.status === 'enacted' ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl'}`}>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-2xl font-serif font-bold text-gray-900 leading-tight">{edict.title}</h3>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${edict.status === 'voting' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {edict.status === 'voting' ? 'En Scrutin' : 'Adopté'}
          </span>
        </div>
        <p className="text-[16px] text-gray-700 leading-relaxed mb-10 font-medium whitespace-pre-wrap">{edict.description}</p>
        <div className="space-y-4">
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
            <span>{edict.votes_count} signatures</span>
            <span>Objectif : {edict.threshold}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${edict.status === 'enacted' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>
        {edict.status === 'voting' && (
          <button 
            onClick={handleVote}
            disabled={hasVoted || voting}
            className={`w-full mt-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${hasVoted ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200'}`}
          >
            {voting ? <Loader2 className="animate-spin" /> : hasVoted ? <CheckCircle2 className="w-5 h-5" /> : <VoteIcon className="w-5 h-5" />}
            {hasVoted ? 'Sceau Apposé' : 'Apposer mon Sceau'}
          </button>
        )}
      </div>
    </div>
  );
};

const GovernancePage: React.FC<{ user: User }> = ({ user }) => {
  const [edicts, setEdicts] = useState<Edict[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEdicts();
  }, []);

  const fetchEdicts = async () => {
    const { data } = await supabase.from('edicts').select('*').order('created_at', { ascending: false });
    if (data) setEdicts(data);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-1000">
      <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors text-sm font-bold group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au fil citoyen
      </Link>
      
      {isModalOpen && <EdictModal onClose={() => setIsModalOpen(false)} user={user} onSuccess={fetchEdicts} />}

      <div className="text-center mb-24">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-900 text-amber-500 rounded-[2.5rem] shadow-2xl mb-10 ring-8 ring-gray-50">
          <Gavel className="w-10 h-10" />
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 mb-6 leading-tight">Le Palais des <span className="text-blue-600 italic">Édits</span></h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">Ici, la souveraineté n'est pas un vain mot. Proposez des règles de vie et scellez les lois de notre communauté.</p>
      </div>

      <div className="space-y-12">
        <div className="flex items-center justify-between px-6">
          <h2 className="text-3xl font-serif font-bold text-gray-900">Scrutins Citoyens</h2>
          <button onClick={() => setIsModalOpen(true)} className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400" /> Proposer un Édit
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {edicts.map(e => <EdictCard key={e.id} edict={e} user={user} onVote={fetchEdicts} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernancePage;
