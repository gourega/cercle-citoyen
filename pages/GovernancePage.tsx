
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
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Edict, User } from '../types';
import { useToast } from '../App';

const EdictCard: React.FC<{ edict: Edict, user: User, onVote: () => void }> = ({ edict, user, onVote }) => {
  const { addToast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const progress = (edict.votes_count / edict.threshold) * 100;

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('votes').select('*').eq('edict_id', edict.id).eq('user_id', user.id).maybeSingle();
      if (data) setHasVoted(true);
    };
    checkVoteStatus();
  }, [edict.id, user.id]);

  const handleVote = async () => {
    if (hasVoted || voting) return;
    setVoting(true);
    
    if (supabase) {
      const { error: voteError } = await supabase.from('votes').insert([{ user_id: user.id, edict_id: edict.id }]);
      if (voteError) {
        addToast("Souveraineté : Vote déjà enregistré ou erreur serveur.", "error");
      } else {
        // APPEL RPC ROBUSTE : Incrémentation atomique côté serveur
        await supabase.rpc('increment_edict_votes', { row_id: edict.id });
        setHasVoted(true);
        onVote();
        addToast("Sceau apposé avec succès !", "success");
      }
    } else {
      // Fallback simulation
      setHasVoted(true);
      onVote();
      addToast("Mode démo : Vote simulé.", "success");
    }
    setVoting(false);
  };

  return (
    <div className={`bg-white border-2 rounded-[3rem] p-10 transition-all ${edict.status === 'enacted' ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-100 hover:border-blue-200 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-8">
        <h3 className="text-2xl font-serif font-bold text-gray-900 leading-tight">{edict.title}</h3>
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${edict.status === 'voting' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {edict.status === 'voting' ? 'En Scrutin' : 'Adopté'}
        </span>
      </div>
      <p className="text-gray-700 leading-relaxed mb-10 font-medium">{edict.description}</p>
      <div className="space-y-4">
        <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
          <span>{edict.votes_count} signatures</span>
          <span>Objectif : {edict.threshold}</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full transition-all duration-1000 ${edict.status === 'enacted' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
      </div>
      {edict.status === 'voting' && (
        <button 
          onClick={handleVote}
          disabled={hasVoted || voting}
          className={`w-full mt-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${hasVoted ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-black shadow-xl'}`}
        >
          {voting ? <Loader2 className="animate-spin" /> : hasVoted ? <CheckCircle2 className="w-5 h-5" /> : <VoteIcon className="w-5 h-5" />}
          {hasVoted ? 'Sceau Apposé' : 'Apposer mon Sceau'}
        </button>
      )}
    </div>
  );
};

const GovernancePage: React.FC<{ user: User }> = ({ user }) => {
  const [edicts, setEdicts] = useState<Edict[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEdicts = async () => {
    if (!supabase) {
      setEdicts([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('edicts').select('*').order('created_at', { ascending: false });
    if (data) setEdicts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEdicts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
      <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors text-sm font-bold group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au fil
      </Link>
      
      <div className="text-center mb-24">
        <div className="w-24 h-24 bg-gray-900 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
          <Gavel className="w-10 h-10" />
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">Édits de la Cité</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">Les citoyens proposent, le Cercle décide.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {edicts.length > 0 ? edicts.map(e => (
            <EdictCard key={e.id} edict={e} user={user} onVote={fetchEdicts} />
          )) : (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
               <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun édit en cours de scrutin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GovernancePage;
