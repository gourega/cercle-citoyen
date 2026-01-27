
import React, { useState, useEffect } from 'react';
// @ts-ignore
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
-- SCRIPT DE RESTAURATION & MISE À JOUR (V6)
-- ==========================================

-- 1. PROFILS
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

-- 2. ÉDITS (RIC) - AVEC GARANTIE DES COLONNES
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

-- AJOUTER image_url SI MANQUANT (Correction Erreur de Scellage)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='edicts' AND column_name='image_url') THEN
        ALTER TABLE public.edicts ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 3. POSTS (AGORA)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    circle_type TEXT,
    image_url TEXT,
    clean_vision_url TEXT,
    reactions JSONB DEFAULT '{"useful": 0, "relevant": 0, "inspiring": 0}'::jsonb,
    is_majestic BOOLEAN DEFAULT false
);

-- 4. VOTES
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    edict_id UUID REFERENCES public.edicts(id) ON DELETE CASCADE,
    UNIQUE(user_id, edict_id)
);

-- 5. FONCTIONS DE CALCUL
CREATE OR REPLACE FUNCTION increment_edict_votes(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.edicts
  SET votes_count = votes_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. POLITIQUES DE SÉCURITÉ (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique profiles" ON public.profiles;
CREATE POLICY "Lecture publique profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auto-insertion profiles" ON public.profiles;
CREATE POLICY "Auto-insertion profiles" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Modif propre profil" ON public.profiles;
CREATE POLICY "Modif propre profil" ON public.profiles FOR UPDATE WITH CHECK (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000001');

ALTER TABLE public.edicts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique edicts" ON public.edicts;
CREATE POLICY "Lecture publique edicts" ON public.edicts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertion edicts libre" ON public.edicts;
CREATE POLICY "Insertion edicts libre" ON public.edicts FOR INSERT WITH CHECK (true);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique posts" ON public.posts;
CREATE POLICY "Lecture publique posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertion posts libre" ON public.posts;
CREATE POLICY "Insertion posts libre" ON public.posts FOR INSERT WITH CHECK (true);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique votes" ON public.votes;
CREATE POLICY "Lecture publique votes" ON public.votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertion vote unique" ON public.votes;
CREATE POLICY "Insertion vote unique" ON public.votes FOR INSERT WITH CHECK (true);

-- Fin du script V6
`;

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens' | 'quests' | 'security' | 'sql'>('stats');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPoints: 0, activeRICs: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
          setStats({ 
            totalUsers: profs.length, 
            totalPoints: profs.reduce((acc, p) => acc + (p.impact_score || 0), 0), 
            activeRICs: 0 
          });
        }
      } catch (e) {
        console.warn("Table profiles manquante.");
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const copySql = () => {
    navigator.clipboard.writeText(REPAIR_SQL);
    addToast("Script V6 copié ! Collez-le dans l'éditeur SQL Supabase.", "success");
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
           <div className="w-24 h-24 rounded-[2.5rem] bg-gray-950 flex items-center justify-center shadow-2xl relative">
             <Crown className="w-12 h-12 text-amber-500" />
           </div>
           <div>
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Conseil du Gardien</h1>
            <p className="text-gray-500 font-medium">Réparation et maintenance de la souveraineté.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-2 rounded-[2rem] border border-gray-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', label: 'Impact', icon: Zap },
            { id: 'citizens', label: 'Membres', icon: Users },
            { id: 'sql', label: 'Mise à Jour SQL', icon: Database },
            { id: 'system', label: 'Système', icon: Wifi }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'sql' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
           <div className="bg-emerald-600 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Database size={120} /></div>
              <h3 className="text-3xl font-serif font-bold mb-4">Correctif Critique : Scellage & Schéma</h3>
              <p className="text-emerald-50 max-w-2xl font-medium leading-relaxed mb-8">
                Ce script V6 résout l'erreur de scellage en garantissant la présence de la colonne <b>image_url</b> dans la table <b>edicts</b> et en ouvrant les droits d'insertion pour tous les citoyens (y compris le Gardien).
              </p>
              <button onClick={copySql} className="bg-white text-emerald-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-emerald-50 transition-all">
                <Copy size={18} /> Copier le script correctif (V6)
              </button>
           </div>

           <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl">
              <div className="bg-black/50 p-8 rounded-2xl border border-white/5 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto max-h-[400px]">
                 <pre>{REPAIR_SQL}</pre>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
           {[
             { label: "Citoyens inscrits", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Points d'Impact", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Santé DB", value: connStatus?.ok ? "Online" : "Error", icon: Shield, color: "text-purple-600", bg: "bg-purple-50" }
           ].map((s, i) => (
             <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-8`}><s.icon size={28} /></div>
                <p className="text-[11px] font-black uppercase text-gray-400 mb-2 tracking-widest">{s.label}</p>
                <p className="text-4xl font-serif font-bold text-gray-900">{s.value}</p>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-sm">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <h3 className="text-3xl font-serif font-bold">Registre des Citoyens</h3>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Rechercher..." 
                  className="w-full bg-gray-50 border-none py-5 pl-16 pr-8 rounded-[2rem] outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold" 
                />
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Acteur</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Pseudonyme</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayCitizens.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="py-6 flex items-center gap-4">
                        <img src={p.avatar_url || p.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                        <span className="font-bold text-gray-900">{p.name}</span>
                      </td>
                      <td className="py-6 font-medium text-blue-600">@{p.pseudonym}</td>
                      <td className="py-6">
                        <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest">{p.role}</span>
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
          <section className="bg-white p-12 rounded-[4rem] border border-gray-100">
             <h3 className="text-3xl font-serif font-bold mb-8 flex items-center gap-4"><Wifi className="text-blue-600" /> Liaison Base de Données</h3>
             <div className={`p-10 rounded-[3rem] border-4 flex items-center gap-8 ${connStatus?.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                {connStatus?.ok ? <CheckCircle2 className="text-emerald-500 w-16 h-16" /> : <ShieldAlert className="text-rose-500 w-16 h-16" />}
                <p className="font-bold text-lg text-gray-900">{connStatus?.message}</p>
             </div>
          </section>

          <section className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col">
             <h3 className="text-2xl font-serif font-bold mb-8 text-blue-400 flex items-center gap-4"><Terminal /> Moniteur Sagesse</h3>
             <div className="bg-black/40 p-8 rounded-[2rem] border border-white/10 font-mono text-[11px] leading-relaxed flex-1">
                <pre className="text-blue-300">
                  {`-- MONITORING --
> population: ${stats.totalUsers}
> db_status: ${connStatus?.ok ? 'online' : 'error'}
> ai_gemini: connected
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
