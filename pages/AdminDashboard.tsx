
import React, { useState, useEffect } from 'react';
import { Crown, ShieldCheck, Loader2, RefreshCw, Terminal, Copy, Wifi, ShieldAlert, Users, Zap, Target, Landmark, Search, Check, X, Ban, UserX, CheckCircle2 } from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';
import { Role, UserCategory } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens' | 'entities' | 'quests'>('stats');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pendingQuests, setPendingQuests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalPoints: 0, activeEdicts: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const SQL_SCHEMA = `-- INFRASTRUCTURE COMPLÈTE CERCLE CITOYEN (V3.6)
-- RÉPARATION : NETTOYAGE ABSOLU ET POLITIQUES SÉCURISÉES

-- 1. EXTENSION TABLE PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. TABLE POSTS
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    circle_type TEXT,
    is_majestic BOOLEAN DEFAULT false,
    image_url TEXT,
    reactions JSONB DEFAULT '{"useful": 0, "relevant": 0, "inspiring": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. POLITIQUES FORCE
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture_Tous_Posts" ON public.posts;
DROP POLICY IF EXISTS "Insertion_Tous_Posts" ON public.posts;
CREATE POLICY "Lecture_Tous_Posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Insertion_Tous_Posts" ON public.posts FOR INSERT WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles_Public_Read" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Self_Insert" ON public.profiles;
CREATE POLICY "Profiles_Public_Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles_Self_Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
`;

  const fetchData = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    if (isRealSupabase && supabase) {
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profs) {
        setProfiles(profs);
        setStats({ totalUsers: profs.length, totalPosts: 0, totalPoints: 0, activeEdicts: 0 });
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredCitizens = profiles.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
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
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button onClick={() => setActiveTab('stats')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Impact</button>
          <button onClick={() => setActiveTab('citizens')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase ${activeTab === 'citizens' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Membres</button>
          <button onClick={() => setActiveTab('system')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Système</button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           {[
             { label: "Population", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Impact Global", value: stats.totalPoints, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Entités Actives", value: profiles.filter(p => p.category && p.category !== UserCategory.CITIZEN).length, icon: Landmark, color: "text-purple-600", bg: "bg-purple-50" }
           ].map((s, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6`}><s.icon size={24} /></div>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{s.label}</p>
                <p className="text-3xl font-serif font-bold text-gray-900">{s.value}</p>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-12">
              <h3 className="text-3xl font-serif font-bold">Registre des Citoyens</h3>
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher un nom..." className="w-full bg-gray-50 border border-transparent py-4 pl-12 pr-6 rounded-2xl outline-none" />
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-6 text-[10px] font-black uppercase text-gray-400">Acteur</th>
                    <th className="pb-6 text-[10px] font-black uppercase text-gray-400">Rôle</th>
                    <th className="pb-6 text-[10px] font-black uppercase text-gray-400">Statut</th>
                    <th className="pb-6 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCitizens.map(p => (
                    <tr key={p.id}>
                      <td className="py-6 flex items-center gap-4">
                        <img src={p.avatar_url} className="w-10 h-10 rounded-xl object-cover" alt="" />
                        <div className="font-bold">{p.name}</div>
                      </td>
                      <td className="py-6 text-xs font-bold text-gray-500">{p.role}</td>
                      <td className="py-6">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">{p.status || 'active'}</span>
                      </td>
                      <td className="py-6 text-right">
                         <div className="flex justify-end gap-2">
                           <button className="p-3 bg-gray-50 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"><Ban size={18} /></button>
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
             <div className={`p-8 rounded-[2rem] border-2 flex items-center gap-6 ${connStatus?.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                {connStatus?.ok ? <CheckCircle2 className="text-emerald-500 w-12 h-12" /> : <ShieldAlert className="text-rose-500 w-12 h-12" />}
                <p className="font-bold text-sm">{connStatus?.message || 'Vérification...'}</p>
             </div>
          </section>

          <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold flex items-center gap-3 text-blue-400"><Terminal /> SQL V3.6</h3>
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
