
import React, { useState, useEffect } from 'react';
import { 
  Crown, ShieldCheck, Loader2, RefreshCw, Terminal, Copy, Wifi, 
  ShieldAlert, UserX, AlertTriangle, Ban, Trash2, Search,
  CheckCircle2, Mail, AtSign, Filter, Activity, Users, Zap, Gavel,
  ShieldPlus, UserRoundCheck, Shield
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';
import { Role } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens'>('stats');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalPoints: 0, activeEdicts: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const SQL_SCHEMA = `-- MISE À JOUR SOUVERAINE DU SCHÉMA SQL (V2.5)
-- COPIEZ ET EXÉCUTEZ CE SCRIPT DANS L'ÉDITEUR SQL DE SUPABASE

-- 1. TABLE DES PROFILS (EXTENSION MODÉRATION & RÔLES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    name TEXT,
    pseudonym TEXT,
    bio TEXT,
    avatar_url TEXT,
    impact_score INTEGER DEFAULT 0,
    email TEXT,
    role TEXT DEFAULT 'Membre', -- 'Membre', 'Modérateur', 'Administrateur', 'Gardien'
    status TEXT DEFAULT 'active', -- 'active', 'warned', 'suspended'
    warn_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE DES PUBLICATIONS (FIL D'ÉVEIL)
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

-- 3. TABLE DES ÉDITS (GOUVERNANCE)
CREATE TABLE IF NOT EXISTS public.edicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    proposer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'voting', -- 'voting', 'enacted'
    votes_count INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE DES VOTES (LIEN CITOYEN-ÉDIT)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    edict_id UUID REFERENCES public.edicts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, edict_id)
);

-- 5. FONCTION RPC POUR L'INCRÉMENTATION DES VOTES (CRUCIAL)
CREATE OR REPLACE FUNCTION increment_edict_votes(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.edicts
  SET votes_count = votes_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- 6. ACTIVATION RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 7. POLITIQUES
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
CREATE POLICY "Public read access" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Update profile" ON public.profiles;
CREATE POLICY "Update profile" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read posts" ON public.posts;
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert posts" ON public.posts;
CREATE POLICY "Insert posts" ON public.posts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read edicts" ON public.edicts;
CREATE POLICY "Public read edicts" ON public.edicts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert votes" ON public.votes;
CREATE POLICY "Insert votes" ON public.votes FOR INSERT WITH CHECK (true);
`;

  const fetchData = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        // Fix: Removed 'filter' from select options and used .eq() chain instead to count edicts with 'voting' status
        const { count: edictCount } = await supabase.from('edicts').select('*', { count: 'exact', head: true }).eq('status', 'voting');
        
        if (profs) {
          setCitizens(profs);
          const points = profs.reduce((acc, curr) => acc + (curr.impact_score || 0), 0);
          setStats({
            totalUsers: profs.length,
            totalPosts: postCount || 0,
            totalPoints: points,
            activeEdicts: edictCount || 0
          });
        }
      } catch (e) {
        console.error("Fetch error:", e);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateRole = async (citizen: any, newRole: string) => {
    if (!isRealSupabase || !supabase) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', citizen.id);
    if (!error) {
      setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, role: newRole } : c));
      addToast(`Rôle de ${citizen.name} mis à jour : ${newRole}`, "success");
    }
  };

  const handleWarn = async (citizen: any) => {
    if (!isRealSupabase || !supabase) return;
    const newCount = (citizen.warn_count || 0) + 1;
    const { error } = await supabase.from('profiles').update({ warn_count: newCount, status: 'warned' }).eq('id', citizen.id);
    if (!error) {
      setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, warn_count: newCount, status: 'warned' } : c));
      addToast(`Avertissement envoyé à ${citizen.name}.`, "info");
    }
  };

  const handleSuspend = async (citizen: any) => {
    if (!isRealSupabase || !supabase) return;
    const newStatus = citizen.status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', citizen.id);
    if (!error) {
      setCitizens(prev => prev.map(c => c.id === citizen.id ? { ...c, status: newStatus } : c));
      addToast(`Compte de ${citizen.name} : ${newStatus === 'suspended' ? 'Suspendu' : 'Réactivé'}.`, "info");
    }
  };

  const filteredCitizens = citizens.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.pseudonym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <p className="text-gray-500 font-medium">Leviers de Gouvernance & Modération.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('stats')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Tableau d'Impact</button>
          <button onClick={() => setActiveTab('citizens')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'citizens' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Citoyens</button>
          <button onClick={() => setActiveTab('system')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Système</button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in slide-in-from-bottom-4">
           {[
             { label: "Population", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Publications", value: stats.totalPosts, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Impact Global", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
             { label: "Édits en Scrutin", value: stats.activeEdicts, icon: Gavel, color: "text-purple-600", bg: "bg-purple-50" }
           ].map((s, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6`}>
                   <s.icon size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
                <p className="text-3xl font-serif font-bold text-gray-900">{s.value}</p>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm animate-in fade-in">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <h3 className="text-3xl font-serif font-bold">Gestion des Citoyens</h3>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nom, pseudo, rôle..." className="w-full bg-gray-50 border border-transparent py-4 pl-12 pr-6 rounded-2xl outline-none focus:bg-white focus:border-blue-100 transition-all font-bold text-sm shadow-inner" />
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Citoyen</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Rôle</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCitizens.map(citizen => (
                    <tr key={citizen.id} className="group">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <img src={citizen.avatar_url || `https://picsum.photos/seed/${citizen.id}/100/100`} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                          <div>
                            <p className="font-bold text-gray-900">{citizen.name}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase">@{citizen.pseudonym}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <select 
                          value={citizen.role} 
                          onChange={(e) => handleUpdateRole(citizen, e.target.value)}
                          className="bg-gray-50 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="Membre">Membre</option>
                          <option value="Modérateur">Modérateur</option>
                          <option value="Administrateur">Administrateur</option>
                          <option value="Gardien">Gardien</option>
                        </select>
                      </td>
                      <td className="py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${citizen.status === 'suspended' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {citizen.status}
                        </span>
                      </td>
                      <td className="py-6 text-right">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => handleWarn(citizen)} title="Avertir" className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 border border-amber-100"><AlertTriangle size={18} /></button>
                            <button onClick={() => handleSuspend(citizen)} title="Suspendre" className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 border border-rose-100"><Ban size={18} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-2xl font-serif font-bold flex items-center gap-3"><Wifi className="text-blue-600" /> État Civil Cloud</h3>
               <button onClick={fetchData} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
             </div>
             <div className={`p-8 rounded-[2rem] border-2 mb-8 flex items-center gap-6 ${connStatus?.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                {connStatus?.ok ? <CheckCircle2 className="text-emerald-500 w-12 h-12" /> : <ShieldAlert className="text-rose-500 w-12 h-12" />}
                <div>
                   <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-1">Status de Liaison</p>
                   <p className={`text-sm font-bold ${connStatus?.ok ? 'text-emerald-800' : 'text-rose-800'}`}>{connStatus?.message || 'Vérification...'}</p>
                </div>
             </div>
             <p className="text-xs text-gray-400 font-medium leading-relaxed px-4">
               Si la liaison est inactive, assurez-vous que vos variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont correctement configurées dans votre environnement.
             </p>
          </section>

          <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold flex items-center gap-3 text-blue-400"><Terminal /> SQL V2.5</h3>
                <button onClick={() => { navigator.clipboard.writeText(SQL_SCHEMA); addToast("SQL Copié !", "success"); }} className="p-3 bg-white/10 rounded-xl hover:bg-white/20"><Copy size={18} /></button>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/60 mb-4 px-2">Script d'Infrastructure Souveraine</p>
             <div className="bg-black/40 p-6 rounded-2xl border border-white/10 font-mono text-[10px] leading-relaxed relative">
                <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap max-h-80">{SQL_SCHEMA}</pre>
             </div>
             <div className="mt-6 flex items-start gap-3 bg-blue-900/30 p-4 rounded-xl border border-blue-800/50">
               <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
               <p className="text-[10px] text-blue-100 leading-relaxed italic">
                 Note : L'exécution de ce script peut déclencher un avertissement "destructive operation" dans Supabase. C'est normal, car il réinitialise les politiques d'accès pour garantir la sécurité.
               </p>
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
