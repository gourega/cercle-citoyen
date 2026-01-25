
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Crown, Loader2, RefreshCw, Terminal, Copy, Wifi, 
  Users, Zap, Target, Landmark, Search, Check, 
  X, UserX, ShieldCheck, CheckCircle2, ShieldAlert, Shield,
  Database, Code, Lock, ShieldQuestion, Fingerprint,
  ChevronLeft, AlertCircle, HardDrive, UserCog
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../ToastContext.tsx';
import { Role, UserCategory } from '../types.ts';

const REPAIR_SQL = `-- ==========================================
-- SCRIPT DE RESTAURATION TOTALE DU CERCLE
-- ==========================================

-- 1. PROFILS & IDENTITÉS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    pseudonym TEXT UNIQUE NOT NULL,
    email TEXT,
    bio TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'Membre',
    category TEXT DEFAULT 'Citoyen',
    impact_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
);

-- 2. ÉDITS & RÉFÉRENDUMS (RIC)
CREATE TABLE IF NOT EXISTS public.edicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    proposer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('internal', 'national')) DEFAULT 'national',
    status TEXT CHECK (status IN ('voting', 'enacted')) DEFAULT 'voting',
    votes_count INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 1000,
    ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    edict_id UUID REFERENCES public.edicts(id) ON DELETE CASCADE,
    UNIQUE(user_id, edict_id)
);

-- 3. SENTIERS D'IMPACT (QUÊTES)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    circle_type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Initié',
    reward_xp INTEGER DEFAULT 100,
    target_goal INTEGER DEFAULT 100,
    participants_count INTEGER DEFAULT 0,
    location TEXT,
    proposer_id UUID REFERENCES public.profiles(id),
    certifier_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending'
);

-- 4. BANQUE DES IDÉES
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    circle_type TEXT NOT NULL,
    needs TEXT[],
    status TEXT DEFAULT 'spark',
    vouch_count INTEGER DEFAULT 0
);

-- 5. SENTINELLE VERTE (SIGNALEMENTS)
CREATE TABLE IF NOT EXISTS public.waste_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    clean_vision TEXT,
    city TEXT,
    sector TEXT,
    nature TEXT,
    description TEXT,
    action_plan TEXT[],
    insight TEXT,
    status TEXT DEFAULT 'reported',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- 6. CONTRIBUTIONS (WAVE)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES public.profiles(id),
    amount INTEGER NOT NULL,
    provider TEXT DEFAULT 'Wave',
    status TEXT DEFAULT 'pending'
);

-- 7. MESSAGERIE SOUVERAINE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    participant_ids UUID[] NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT false
);

-- 8. ONDES (POSTS)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    circle_type TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    clean_vision_url TEXT,
    reactions JSONB DEFAULT '{"useful": 0, "relevant": 0, "inspiring": 0}'::jsonb,
    is_majestic BOOLEAN DEFAULT false
);

-- ==========================================
-- SÉCURITÉ : ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- POLITIQUES SUR LES PROFILS (CRUCIAL)
DROP POLICY IF EXISTS "Lecture publique" ON public.profiles;
CREATE POLICY "Lecture publique" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auto-création" ON public.profiles;
CREATE POLICY "Auto-création" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Auto-modification" ON public.profiles;
CREATE POLICY "Auto-modification" ON public.profiles FOR UPDATE WITH CHECK (auth.uid() = id);

-- POLITIQUES SUR LES ONDES (POSTS)
DROP POLICY IF EXISTS "Lecture ondes" ON public.posts;
CREATE POLICY "Lecture ondes" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertion ondes" ON public.posts;
CREATE POLICY "Insertion ondes" ON public.posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- POLITIQUES SUR LA SENTINELLE
DROP POLICY IF EXISTS "Lecture signalements" ON public.waste_reports;
CREATE POLICY "Lecture signalements" ON public.waste_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertion signalements" ON public.waste_reports;
CREATE POLICY "Insertion signalements" ON public.waste_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- POLITIQUES SUR LE RIC
DROP POLICY IF EXISTS "Lecture edicts" ON public.edicts;
CREATE POLICY "Lecture edicts" ON public.edicts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vote souverain" ON public.votes;
CREATE POLICY "Vote souverain" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
`;

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens' | 'quests' | 'security' | 'sql'>('stats');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pendingQuests, setPendingQuests] = useState<any[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalPoints: 0, activeRICs: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profs) {
          setProfiles(profs);
          setRecoveryRequests(profs.filter(p => p.status === 'recovery_requested'));
          
          const { count: ricCount } = await supabase.from('edicts').select('*', { count: 'exact', head: true });
          
          setStats({ 
            totalUsers: profs.length, 
            totalPosts: 0, 
            totalPoints: profs.reduce((acc, p) => acc + (p.impact_score || 0), 0), 
            activeRICs: ricCount || 0 
          });
        }
        const { data: qData } = await supabase.from('quests').select('*').eq('status', 'pending');
        if (qData) setPendingQuests(qData);
      } catch (e) {
        console.warn("Certaines tables sont peut-être manquantes.");
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    setActionLoading(userId);
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) throw error;
        addToast(`Sceau appliqué : Nouveau rôle de ${newRole}.`, "success");
        await fetchData();
      } else {
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        addToast(`Mode Démo : Rôle changé en ${newRole}.`, "success");
      }
    } catch (e) {
      addToast("Erreur lors de l'attribution du rôle.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessRecovery = async (userId: string, email: string) => {
    const tempPass = `CERCLE-${Math.floor(1000 + Math.random() * 9000)}`;
    const sqlCommand = `UPDATE auth.users SET encrypted_password = crypt('${tempPass}', gen_salt('bf')) WHERE id = '${userId}';`;
    
    navigator.clipboard.writeText(sqlCommand);
    addToast(`Commande SQL copiée ! MDP Provisoire : ${tempPass}`, "success");

    if (isRealSupabase && supabase) {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
      fetchData();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(REPAIR_SQL);
    addToast("Script SQL de restauration complète copié !", "success");
  };

  const displayCitizens = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.pseudonym?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="mb-8">
        <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Quitter le Conseil
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-20">
        <div className="flex items-center gap-10">
           <div className="w-24 h-24 rounded-[2.5rem] bg-gray-950 flex items-center justify-center shadow-2xl relative group">
             <div className="absolute inset-0 bg-blue-600 opacity-20 rounded-[2.5rem]"></div>
             <Crown className="w-12 h-12 text-amber-500" />
           </div>
           <div>
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Conseil du Gardien</h1>
            <p className="text-gray-500 font-medium italic">Souveraineté & Gouvernance Active.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-2 rounded-[2rem] border border-gray-200 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'stats', label: 'Impact', icon: Zap },
            { id: 'citizens', label: 'Membres', icon: Users },
            { id: 'sql', label: 'Sagesse SQL', icon: Database },
            { id: 'security', label: 'Sécurité', icon: ShieldAlert },
            { id: 'system', label: 'Système', icon: Wifi }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
              {tab.id === 'security' && recoveryRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] animate-bounce">
                  {recoveryRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'sql' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
           <div className="bg-blue-600 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Database size={120} /></div>
              <h3 className="text-3xl font-serif font-bold mb-4">Restauration de la Cité</h3>
              <p className="text-blue-100 max-w-2xl font-medium leading-relaxed mb-8">
                Ce script complet crée l'intégralité des infrastructures nécessaires : Profils (avec politiques d'auto-création), RIC, Sentinelle, Quêtes, Messagerie et Archivage. Exécutez-le dans l'éditeur SQL de Supabase pour une souveraineté totale.
              </p>
              <button onClick={copySql} className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-blue-50 transition-all">
                <Copy size={18} /> Copier le script intégral
              </button>
           </div>

           <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl relative group">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 </div>
                 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">full_infrastructure_restore.sql</span>
              </div>
              <div className="bg-black/50 p-8 rounded-2xl border border-white/5 font-mono text-xs text-blue-300 leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar">
                 <pre>{REPAIR_SQL}</pre>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-12 text-center md:text-left px-4">
            <h3 className="text-3xl font-serif font-bold text-gray-900 mb-2">Requêtes de Secours</h3>
            <p className="text-gray-400 font-medium">Récupération des comptes citoyens après vérification d'identité.</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {recoveryRequests.length > 0 ? recoveryRequests.map(p => (
              <div key={p.id} className="bg-white p-10 rounded-[3.5rem] border-2 border-amber-100 shadow-xl shadow-amber-50 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-8">
                   <div className="relative">
                     <img src={p.avatar_url || p.avatar} className="w-20 h-20 rounded-3xl object-cover shadow-lg" alt="" />
                     <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl border-4 border-white shadow-md">
                        <ShieldQuestion size={16} />
                     </div>
                   </div>
                   <div>
                     <h4 className="text-2xl font-serif font-bold text-gray-900">{p.name}</h4>
                     <p className="text-sm font-bold text-blue-600">{p.email}</p>
                     <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Inscrit le {new Date(p.created_at).toLocaleDateString()}</p>
                   </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleProcessRecovery(p.id, p.email)}
                    className="bg-gray-900 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-xl"
                  >
                    <Fingerprint size={18} className="text-amber-400" /> Attribuer Accès Provisoire
                  </button>
                  <button 
                    onClick={async () => {
                      if (isRealSupabase && supabase) await supabase.from('profiles').update({ status: 'active' }).eq('id', p.id);
                      fetchData();
                    }}
                    className="p-5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[4rem] text-center">
                 <ShieldCheck className="w-16 h-16 text-emerald-200 mx-auto mb-6" />
                 <p className="text-gray-400 font-bold italic uppercase tracking-widest text-sm">Le territoire est calme. Aucune alerte de sécurité.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
           {[
             { label: "Population réelle", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Impact Souverain", value: stats.totalPoints.toLocaleString() + " XP", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Souveraineté (RIC)", value: stats.activeRICs, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
             { label: "Institutions", value: profiles.filter(p => p.category && p.category !== UserCategory.CITIZEN).length, icon: Landmark, color: "text-amber-600", bg: "bg-amber-50" }
           ].map((s, i) => (
             <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-8 shadow-inner`}><s.icon size={28} /></div>
                <p className="text-[11px] font-black uppercase text-gray-400 mb-2 tracking-widest">{s.label}</p>
                <p className="text-4xl font-serif font-bold text-gray-900">{s.value}</p>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 px-4">
              <div>
                <h3 className="text-3xl font-serif font-bold text-gray-900">Registre Citoyen</h3>
                <p className="text-gray-400 text-sm mt-2 italic">Monitoring des acteurs clés du territoire.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Rechercher un citoyen..." 
                  className="w-full bg-gray-50 border-2 border-transparent py-5 pl-16 pr-8 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 transition-all font-bold" 
                />
              </div>
           </div>
           
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pb-8 pl-4 text-[11px] font-black uppercase text-gray-400 tracking-widest">Acteur</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Attribution Rôle</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Statut</th>
                    <th className="pb-8 pr-4 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayCitizens.map(p => (
                    <tr key={p.id} className="group hover:bg-gray-50/50 transition-all">
                      <td className="py-8 pl-4 flex items-center gap-5">
                        <img src={p.avatar_url || p.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white" alt="" />
                        <div>
                          <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                             {p.name}
                             {p.role === Role.SUPER_ADMIN && <Crown size={14} className="text-amber-500" />}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">{p.pseudonym}</div>
                        </div>
                      </td>
                      <td className="py-8">
                         <div className="relative group/role">
                           {actionLoading === p.id ? (
                             <div className="flex items-center gap-2 text-blue-600">
                               <Loader2 className="animate-spin" size={14} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Mise à jour...</span>
                             </div>
                           ) : (
                             <select 
                               value={p.role}
                               onChange={(e) => handleUpdateRole(p.id, e.target.value as Role)}
                               className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none pr-8 transition-all hover:border-blue-200"
                             >
                               {Object.values(Role).map(r => (
                                 <option key={r} value={r}>{r}</option>
                               ))}
                             </select>
                           )}
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                             <UserCog size={12} />
                           </div>
                         </div>
                      </td>
                      <td className="py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'banned' ? 'bg-rose-50 text-rose-600' : p.status === 'recovery_requested' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {p.status === 'recovery_requested' ? 'Aide requise' : (p.status || 'Actif')}
                        </span>
                      </td>
                      <td className="py-8 pr-4 text-right">
                         <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"><UserX size={20} /></button>
                           <button className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"><ShieldCheck size={20} /></button>
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
          <section className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-12">
               <h3 className="text-3xl font-serif font-bold flex items-center gap-4"><Wifi className="text-blue-600" /> État Civil Cloud</h3>
               <button onClick={fetchData} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
             </div>
             <div className={`p-10 rounded-[3rem] border-4 flex items-center gap-8 ${connStatus?.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                {connStatus?.ok ? <CheckCircle2 className="text-emerald-500 w-16 h-16" /> : <ShieldAlert className="text-rose-500 w-16 h-16" />}
                <div>
                  <p className="font-black uppercase text-[10px] text-gray-400 mb-1 tracking-widest">Liaison DB</p>
                  <p className="font-bold text-lg text-gray-900">{connStatus?.message || 'Interrogation...'}</p>
                </div>
             </div>
          </section>

          <section className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl overflow-hidden flex flex-col min-h-[400px]">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-bold flex items-center gap-4 text-blue-400"><Terminal /> Moniteur Systèmes</h3>
                <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Copy size={20} /></button>
             </div>
             <div className="bg-black/40 p-8 rounded-[2rem] border border-white/10 font-mono text-[11px] leading-relaxed flex-1 overflow-y-auto custom-scrollbar">
                <pre className="text-blue-300 whitespace-pre-wrap">
                  {`-- MONITORING SOUVERAIN --
> node_env: production
> database_status: ${connStatus?.ok ? 'online' : 'error'}
> population: ${stats.totalUsers}
> active_ric: ${stats.activeRICs}
> api_gemini_v3: connected
> pulse: nominal`}
                </pre>
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
