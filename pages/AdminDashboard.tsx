
import React, { useState, useEffect } from 'react';
import { 
  Crown, ShieldCheck, Loader2, RefreshCw, Terminal, Copy, Wifi, 
  ShieldAlert, UserX, AlertTriangle, Ban, Trash2, Search,
  CheckCircle2, Mail, AtSign, Filter
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens'>('system');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const SQL_SCHEMA = `-- MISE À JOUR SOUVERAINE DU SCHÉMA SQL

-- 1. TABLE DES PROFILS AVEC MODÉRATION
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    name TEXT,
    pseudonym TEXT,
    bio TEXT,
    avatar_url TEXT,
    impact_score INTEGER DEFAULT 0,
    email TEXT,
    role TEXT DEFAULT 'Membre',
    status TEXT DEFAULT 'active', -- active, warned, suspended
    warn_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE DES PUBLICATIONS
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    circle_type TEXT,
    image_url TEXT,
    reactions JSONB DEFAULT '{"useful": 0, "relevant": 0, "inspiring": 0}'::jsonb,
    is_majestic BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE DES ÉDITS
CREATE TABLE IF NOT EXISTS public.edicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    proposer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'voting',
    votes_count INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE DES VOTES
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    edict_id UUID REFERENCES public.edicts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, edict_id)
);

-- ACTIVATION RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- POLITIQUES IDEMPOTENTES
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
CREATE POLICY "Public read access" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access posts" ON public.posts;
CREATE POLICY "Public read access posts" ON public.posts FOR SELECT USING (true);
`;

  const initDiagnostic = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setCitizens(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    initDiagnostic();
  }, []);

  const handleWarn = async (citizen: any) => {
    if (!isRealSupabase || !supabase) return;
    const newCount = (citizen.warn_count || 0) + 1;
    const { error } = await supabase
      .from('profiles')
      .update({ warn_count: newCount, status: 'warned' })
      .eq('id', citizen.id);
    
    if (!error) {
      setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, warn_count: newCount, status: 'warned' } : c));
      addToast(`Citoyen ${citizen.name} averti (${newCount} avertissements).`, "info");
    }
  };

  const handleSuspend = async (citizen: any) => {
    if (!isRealSupabase || !supabase) return;
    const newStatus = citizen.status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', citizen.id);
    
    if (!error) {
      setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, status: newStatus } : c));
      addToast(`Statut de ${citizen.name} : ${newStatus === 'suspended' ? 'Suspendu' : 'Réactivé'}.`, "info");
    }
  };

  const handleDelete = async (citizen: any) => {
    if (!isRealSupabase || !supabase) return;
    if (!window.confirm(`Êtes-vous certain de vouloir bannir définitivement ${citizen.name} de la Cité ?`)) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', citizen.id);
    
    if (!error) {
      setCitizens(prev => prev.filter(c => c.id !== citizen.id));
      addToast(`Le citoyen ${citizen.name} a été révoqué.`, "error");
    }
  };

  const filteredCitizens = citizens.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.pseudonym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
        <div className="flex items-center gap-8">
           <div className="w-20 h-20 rounded-3xl bg-gray-900 flex items-center justify-center shadow-xl">
             <Crown className="w-10 h-10 text-amber-500" />
           </div>
           <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">Conseil du Gardien</h1>
            <p className="text-gray-500 font-medium">Infrastructure & Modération de la Cité.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('system')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Configuration</button>
          <button onClick={() => setActiveTab('citizens')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'citizens' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Citoyens</button>
        </div>
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-2xl font-serif font-bold flex items-center gap-3"><Wifi className="text-blue-600" /> Diagnostic</h3>
               <button onClick={initDiagnostic} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
             </div>

             <div className={`p-8 rounded-[2rem] border-2 mb-8 flex items-center gap-6 ${connStatus?.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                {connStatus?.ok ? <CheckCircle2 className="text-emerald-500 w-12 h-12" /> : <ShieldAlert className="text-rose-500 w-12 h-12" />}
                <div>
                   <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-1">Status Liaison</p>
                   <p className={`text-sm font-bold ${connStatus?.ok ? 'text-emerald-800' : 'text-rose-800'}`}>{connStatus?.message || 'Vérification...'}</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                   <span className="text-[10px] font-black uppercase text-gray-400">URL API</span>
                   <span className="font-mono text-[10px] font-bold">nfsskgcpqbccnwacsplc.supabase.co</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                   <span className="text-[10px] font-black uppercase text-gray-400">Ressources</span>
                   <span className="font-mono text-[10px] font-bold">{citizens.length} Profils Détectés</span>
                </div>
             </div>
          </section>

          <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5"><Terminal className="w-40 h-40" /></div>
             <h3 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3 text-blue-400 relative z-10"><Terminal /> SQL Editor</h3>
             <p className="text-slate-400 text-sm mb-8 leading-relaxed relative z-10">Script pour activer la modération et la gestion des statuts citoyens.</p>
             <div className="bg-black/40 p-6 rounded-2xl border border-white/10 relative font-mono text-[10px] leading-relaxed mb-8">
                <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap max-h-80">{SQL_SCHEMA}</pre>
                <button onClick={() => { navigator.clipboard.writeText(SQL_SCHEMA); addToast("Script SQL copié !", "success"); }} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl"><Copy size={18} /></button>
             </div>
          </section>
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <h3 className="text-3xl font-serif font-bold flex items-center gap-4">
                Population de la Cité <span className="text-lg bg-gray-100 px-4 py-1 rounded-full text-gray-400 font-sans">{filteredCitizens.length}</span>
              </h3>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom, pseudo ou email..."
                  className="w-full bg-gray-50 border border-transparent py-4 pl-12 pr-6 rounded-2xl outline-none focus:bg-white focus:border-blue-100 transition-all font-bold text-sm shadow-inner"
                />
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Citoyen</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Points</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions de Modération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCitizens.map(citizen => (
                    <tr key={citizen.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <img src={citizen.avatar_url} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                          <div>
                            <p className="font-bold text-gray-900">{citizen.name}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                              <span className="flex items-center gap-1"><AtSign size={10} /> {citizen.pseudonym}</span>
                              <span className="flex items-center gap-1"><Mail size={10} /> {citizen.email || 'Non renseigné'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                         <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${
                              citizen.status === 'suspended' ? 'bg-rose-100 text-rose-600' : 
                              citizen.status === 'warned' ? 'bg-amber-100 text-amber-600' : 
                              'bg-emerald-100 text-emerald-600'
                            }`}>
                              {citizen.status === 'suspended' ? 'Suspendu' : citizen.status === 'warned' ? 'Sous Surveillance' : 'Citoyen Actif'}
                            </span>
                            {citizen.warn_count > 0 && (
                              <p className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter ml-1">
                                {citizen.warn_count} avertissement{citizen.warn_count > 1 ? 's' : ''}
                              </p>
                            )}
                         </div>
                      </td>
                      <td className="py-6">
                        <span className="font-mono font-bold text-gray-900">{citizen.impact_score?.toLocaleString()}</span>
                      </td>
                      <td className="py-6">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleWarn(citizen)}
                              title="Donner un avertissement"
                              className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all border border-amber-100"
                            >
                               <AlertTriangle size={18} />
                            </button>
                            <button 
                              onClick={() => handleSuspend(citizen)}
                              title={citizen.status === 'suspended' ? "Réactiver" : "Suspendre l'accès"}
                              className={`p-3 rounded-xl transition-all border ${
                                citizen.status === 'suspended' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                  : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100'
                              }`}
                            >
                               <Ban size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(citizen)}
                              title="Bannir définitivement"
                              className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCitizens.length === 0 && (
                <div className="py-32 text-center">
                   <UserX className="w-20 h-20 text-gray-100 mx-auto mb-6" />
                   <p className="text-gray-400 font-bold uppercase tracking-widest">Aucun citoyen trouvé dans le registre.</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
