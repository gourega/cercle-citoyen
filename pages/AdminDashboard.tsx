
import React, { useState, useEffect } from 'react';
import { 
  Crown, ShieldCheck, Loader2, RefreshCw, Terminal, Copy, Wifi, 
  ShieldAlert, UserX, AlertTriangle, Ban, Trash2, Search,
  CheckCircle2, Mail, AtSign, Filter, Activity, Users, Zap, Gavel,
  ShieldPlus, UserRoundCheck, Shield, AlertCircle, MapPin, Target, Check, X
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';
import { Role } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens' | 'quests'>('stats');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [pendingQuests, setPendingQuests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalPoints: 0, activeEdicts: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const SQL_SCHEMA = `-- INFRASTRUCTURE SOUVERAINE CERCLE CITOYEN (V2.9.1)
-- RÉPARATION CRUCIALE : AUTORISER L'INSCRIPTION ET LES SENTIERS

-- 1. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    name TEXT,
    pseudonym TEXT,
    bio TEXT,
    avatar_url TEXT,
    impact_score INTEGER DEFAULT 0,
    email TEXT,
    role TEXT DEFAULT 'Membre',
    status TEXT DEFAULT 'active',
    warn_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE QUESTS (SENTIERS D'IMPACT)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    circle_type TEXT,
    difficulty TEXT DEFAULT 'Initié',
    reward_xp INTEGER DEFAULT 100,
    current_progress INTEGER DEFAULT 0,
    target_goal INTEGER DEFAULT 100,
    participants_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, validated, certified, rejected
    location TEXT,
    proposer_id UUID REFERENCES public.profiles(id),
    validator_id UUID REFERENCES public.profiles(id),
    certifier_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ACTIVATION RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- 4. POLITIQUES QUESTS
DROP POLICY IF EXISTS "Lecture publique des quêtes" ON public.quests;
CREATE POLICY "Lecture publique des quêtes" ON public.quests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertion par les citoyens" ON public.quests;
CREATE POLICY "Insertion par les citoyens" ON public.quests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Mise à jour par Admin ou Institution" ON public.quests;
CREATE POLICY "Mise à jour par Admin ou Institution" ON public.quests FOR UPDATE USING (true);

-- 5. POLITIQUES PROFILES
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
CREATE POLICY "Public read access" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert" ON public.profiles;
CREATE POLICY "Allow public insert" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (true);
`;

  const fetchData = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        const { data: qData } = await supabase.from('quests').select('*, proposer:proposer_id(name, pseudonym)').eq('status', 'pending');
        
        if (profs) {
          setCitizens(profs);
          const points = profs.reduce((acc, curr) => acc + (curr.impact_score || 0), 0);
          setStats({
            totalUsers: profs.length,
            totalPosts: postCount || 0,
            totalPoints: points,
            activeEdicts: 0
          });
        }
        if (qData) setPendingQuests(qData);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleValidateQuest = async (questId: string, approved: boolean) => {
    if (!isRealSupabase || !supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('quests')
      .update({ 
        status: approved ? 'validated' : 'rejected',
        validator_id: user.id 
      })
      .eq('id', questId);
    
    if (!error) {
      addToast(approved ? "Sentier validé avec succès !" : "Proposition écartée.", approved ? "success" : "info");
      setPendingQuests(prev => prev.filter(q => q.id !== questId));
    }
  };

  const filteredCitizens = citizens.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.pseudonym?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <button onClick={() => setActiveTab('stats')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Impact</button>
          <button onClick={() => setActiveTab('citizens')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'citizens' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Citoyens</button>
          <button onClick={() => setActiveTab('quests')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'quests' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Sentiers ({pendingQuests.length})</button>
          <button onClick={() => setActiveTab('system')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Système</button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in slide-in-from-bottom-4">
           {[
             { label: "Population", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Sentiers en Attente", value: pendingQuests.length, icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
             { label: "Impact Global", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Publications", value: stats.totalPosts, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" }
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

      {activeTab === 'quests' && (
        <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm">
           <h3 className="text-3xl font-serif font-bold mb-10">Validation des Sentiers</h3>
           {pendingQuests.length > 0 ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {pendingQuests.map(q => (
                 <div key={q.id} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <Target />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{q.title}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400">Proposé par {q.proposer?.name} (@{q.proposer?.pseudonym})</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-8 leading-relaxed">{q.description}</p>
                    <div className="flex gap-4">
                       <button onClick={() => handleValidateQuest(q.id, true)} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                         <Check size={16} /> Approuver
                       </button>
                       <button onClick={() => handleValidateQuest(q.id, false)} className="flex-1 bg-white border border-rose-100 text-rose-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                         <X size={16} /> Rejeter
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-20 text-gray-400 italic">Aucune proposition en attente de validation.</div>
           )}
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm">
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
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-gray-50">{citizen.role}</span>
                      </td>
                      <td className="py-6 text-right">
                         <div className="flex justify-end gap-2">
                            <button title="Avertir" className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 border border-amber-100"><AlertTriangle size={18} /></button>
                            <button title="Suspendre" className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 border border-rose-100"><Ban size={18} /></button>
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
          </section>

          <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold flex items-center gap-3 text-blue-400"><Terminal /> SQL V2.9.1</h3>
                <button onClick={() => { navigator.clipboard.writeText(SQL_SCHEMA); addToast("SQL Copié !", "success"); }} className="p-3 bg-white/10 rounded-xl hover:bg-white/20"><Copy size={18} /></button>
             </div>
             <div className="bg-black/40 p-6 rounded-2xl border border-white/10 font-mono text-[10px] leading-relaxed relative">
                <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap max-h-80">{SQL_SCHEMA}</pre>
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
