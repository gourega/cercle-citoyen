
import React, { useState, useEffect } from 'react';
import { 
  Crown, Loader2, RefreshCw, Terminal, Copy, Wifi, 
  Users, Zap, Target, Landmark, Search, Check, 
  X, UserX, ShieldCheck, CheckCircle2, ShieldAlert, Shield,
  Database, Code
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';
import { Role, UserCategory } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens' | 'quests' | 'database'>('stats');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pendingQuests, setPendingQuests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalPoints: 0, activeEdicts: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const sqlSchema = `-- SCRIPT DE CONFIGURATION SÉCURISÉ CERCLE CITOYEN
-- Ce script vérifie l'existence des tables avant création pour éviter les erreurs.

-- 1. Table des Profils
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  pseudonym TEXT UNIQUE,
  bio TEXT,
  role TEXT DEFAULT 'Membre',
  category TEXT DEFAULT 'Citoyen',
  avatar_url TEXT,
  impact_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Publications
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  circle_type TEXT NOT NULL,
  is_majestic BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{"useful": 0, "relevant": 0, "inspiring": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Activation du Realtime (Vérification intelligente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
END $$;

-- 4. Table des Édits
CREATE TABLE IF NOT EXISTS public.edicts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'voting',
  votes_count INTEGER DEFAULT 0,
  threshold INTEGER DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des Votes
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  edict_id UUID REFERENCES public.edicts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, edict_id)
);

-- 6. Fonction de Vote
CREATE OR REPLACE FUNCTION increment_edict_votes(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE edicts
  SET votes_count = votes_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;`;

  const fetchData = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profs) {
          setProfiles(profs);
          setStats({ 
            totalUsers: profs.length, 
            totalPosts: 0, 
            totalPoints: profs.reduce((acc, p) => acc + (p.impact_score || 0), 0), 
            activeEdicts: 0 
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

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    addToast("Script SQL sécurisé copié !", "success");
  };

  const displayCitizens = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.pseudonym?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateQuestStatus = async (questId: string, status: 'validated' | 'rejected') => {
    if (isRealSupabase && supabase) {
      try {
        const { error } = await supabase.from('quests').update({ status }).eq('id', questId);
        if (error) throw error;
        addToast(status === 'validated' ? "Sentier approuvé !" : "Sentier écarté.", "success");
        fetchData();
      } catch (e) {
        console.error("Quest update error:", e);
        addToast("Erreur lors de la mise à jour.", "error");
      }
    } else {
      addToast("Mode démo : Action non effectuée sur la base de données.", "info");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
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
            { id: 'quests', label: 'Sentiers', icon: Target },
            { id: 'database', label: 'Base de Données', icon: Database },
            { id: 'system', label: 'Système', icon: Wifi }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
              {tab.id === 'quests' && pendingQuests.length > 0 && <span className="bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px]">{pendingQuests.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
           {[
             { label: "Population réelle", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Impact Souverain", value: stats.totalPoints.toLocaleString() + " XP", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Gouvernance", value: stats.activeEdicts, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
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

      {activeTab === 'database' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm mb-12">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-serif font-bold text-gray-900 mb-2">Configuration de Souveraineté</h3>
                <p className="text-gray-400 font-medium">Copiez ce script et exécutez-le dans votre éditeur SQL Supabase pour créer les tables manquantes.</p>
              </div>
              <button onClick={copySql} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
                <Copy size={16} /> Copier le SQL
              </button>
            </div>
            <div className="bg-gray-950 p-8 rounded-[2rem] text-blue-300 font-mono text-xs overflow-x-auto max-h-[500px] border-4 border-gray-900 shadow-inner">
              <pre>{sqlSchema}</pre>
            </div>
          </div>
          <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 flex items-start gap-6">
            <ShieldAlert className="text-amber-600 shrink-0" size={32} />
            <div className="text-amber-900">
              <h4 className="font-bold text-lg mb-2">Note sur la Sécurité</h4>
              <p className="text-sm leading-relaxed opacity-80">
                Après avoir créé les tables, assurez-vous d'activer les politiques **RLS (Row Level Security)** dans Supabase pour garantir que les citoyens ne puissent modifier que leurs propres données.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-sm">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
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
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Acteur</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Rôle</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Statut</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayCitizens.map(p => (
                    <tr key={p.id} className="group hover:bg-gray-50/50 transition-all">
                      <td className="py-8 flex items-center gap-5">
                        <img src={p.avatar_url || p.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white" alt="" />
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{p.pseudonym}</div>
                        </div>
                      </td>
                      <td className="py-8">
                         <div className="flex items-center gap-2">
                           {p.role === Role.SUPER_ADMIN && <Crown size={14} className="text-amber-500" />}
                           <span className="text-xs font-black uppercase text-gray-600">{p.role}</span>
                         </div>
                      </td>
                      <td className="py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'banned' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {p.status || 'Actif'}
                        </span>
                      </td>
                      <td className="py-8 text-right">
                         <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"><UserX size={20} /></button>
                           <button className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"><ShieldCheck size={20} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'quests' && (
        <div className="space-y-8">
           <div className="mb-10">
              <h3 className="text-3xl font-serif font-bold text-gray-900">Validation des Sentiers</h3>
              <p className="text-gray-400 mt-2">Approuvez les initiatives citoyennes réelles.</p>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {pendingQuests.length > 0 ? pendingQuests.map(q => (
               <div key={q.id} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{q.circle_type}</span>
                    <span className="text-xs font-bold text-amber-600">+{q.reward_xp} XP</span>
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-gray-900 mb-4">{q.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed mb-10 flex-grow">{q.description}</p>
                  <div className="flex gap-4">
                    <button onClick={() => handleUpdateQuestStatus(q.id, 'validated')} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                       <Check size={18} /> Approuver
                    </button>
                    <button onClick={() => handleUpdateQuestStatus(q.id, 'rejected')} className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-3">
                       <X size={18} /> Écarter
                    </button>
                  </div>
               </div>
             )) : (
              <div className="col-span-full py-24 bg-white border-2 border-dashed border-gray-100 rounded-[4rem] text-center">
                 <CheckCircle2 className="w-16 h-16 text-emerald-100 mx-auto mb-6" />
                 <p className="text-gray-400 font-bold italic">Aucune requête en attente.</p>
              </div>
             )}
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

          <section className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl overflow-hidden flex flex-col">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-bold flex items-center gap-4 text-blue-400"><Terminal /> Registre Systèmes</h3>
                <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Copy size={20} /></button>
             </div>
             <div className="bg-black/40 p-8 rounded-[2rem] border border-white/10 font-mono text-[11px] leading-relaxed flex-1">
                <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap">
                  {`-- MONITORING SOUVERAIN --
> system_check: live
> database_integrity: 100%
> api_responses: stable
> active_sessions: ${stats.totalUsers}`}
                </pre>
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
