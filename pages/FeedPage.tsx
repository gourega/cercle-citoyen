
import React, { useState, useEffect } from 'react';
import { 
  Crown, ShieldCheck, Loader2, RefreshCw, Terminal, Copy, Wifi, 
  ShieldAlert, UserX, AlertTriangle, Ban, Trash2, Search,
  CheckCircle2, Mail, AtSign, Filter, Activity, Users, Zap, Gavel,
  ShieldPlus, UserRoundCheck, Shield, AlertCircle, MapPin, Target, Check, X,
  UserCog, Building2, Store, Landmark, Info, BellRing
} from 'lucide-react';
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

  const SQL_SCHEMA = `-- INFRASTRUCTURE COMPLÈTE CERCLE CITOYEN (V3.3)
-- RÉPARATION : GESTION ROBUSTE DES POLITIQUES ET TABLES

-- 1. EXTENSION TABLE PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. TABLE POSTS (CRÉATION SI NON EXISTANTE)
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

-- 3. CORRECTION NOM DE COLONNE SI TYPO
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='is_majectic') THEN
    ALTER TABLE public.posts RENAME COLUMN is_majectic TO is_majestic;
  END IF;
END $$;

-- 4. TABLE NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    type TEXT,
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. POLITIQUES DE SÉCURITÉ (RLS) - NETTOYAGE PUIS CRÉATION
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture_Tous_Posts" ON public.posts;
CREATE POLICY "Lecture_Tous_Posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertion_Tous_Posts" ON public.posts;
CREATE POLICY "Insertion_Tous_Posts" ON public.posts FOR INSERT WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture_Propre_Notif" ON public.notifications;
CREATE POLICY "Lecture_Propre_Notif" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insert_System" ON public.notifications;
CREATE POLICY "Insert_System" ON public.notifications FOR INSERT WITH CHECK (true);
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
          setProfiles(profs);
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

  const sendNotification = async (userId: string, title: string, message: string, type: string) => {
    if (!supabase) return;
    await supabase.from('notifications').insert([{
      user_id: userId,
      title,
      message,
      type
    }]);
  };

  const handleUpdateStatus = async (profile: any, newStatus: string) => {
    if (!isRealSupabase || !supabase) return;
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', profile.id);
    
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, status: newStatus } : p));
      
      let msg = "";
      if (newStatus === 'active') msg = "Votre accès a été activé par le Gardien.";
      if (newStatus === 'suspended') msg = "Votre accès a été suspendu pour vérification.";
      if (newStatus === 'revoked') msg = "Votre accès a été révoqué définitivement.";
      
      await sendNotification(profile.id, "Mise à jour de Statut", msg, "drum_call");
      addToast(`Statut de ${profile.name} mis à jour : ${newStatus}`, "success");
    }
  };

  const handleUpdateRole = async (profile: any, newRole: string) => {
    if (!isRealSupabase || !supabase) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
      addToast(`Rôle de ${profile.name} mis à jour : ${newRole}`, "success");
    }
  };

  const filteredCitizens = profiles.filter(p => {
    const isSearching = searchTerm.trim().length > 0;
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.pseudonym?.toLowerCase().includes(searchTerm.toLowerCase());
    const isCitizen = p.category === UserCategory.CITIZEN || !p.category;
    
    if (activeTab === 'citizens') {
        if (isSearching) return matchesSearch && isCitizen;
        return isCitizen && p.role !== 'Membre';
    }
    
    if (activeTab === 'entities') {
        const isEntity = p.category && p.category !== UserCategory.CITIZEN;
        if (isSearching) return matchesSearch && isEntity;
        return isEntity;
    }

    return false;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case UserCategory.MUNICIPALITY: return <Landmark className="text-blue-600" size={18} />;
      case UserCategory.ENTERPRISE: return <Building2 className="text-teal-600" size={18} />;
      case UserCategory.LOCAL_BUSINESS: return <Store className="text-amber-600" size={18} />;
      default: return <Shield className="text-gray-400" size={18} />;
    }
  };

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
          <button onClick={() => setActiveTab('citizens')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'citizens' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Membres</button>
          <button onClick={() => setActiveTab('entities')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'entities' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Entités</button>
          <button onClick={() => setActiveTab('quests')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'quests' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Sentiers ({pendingQuests.length})</button>
          <button onClick={() => setActiveTab('system')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Système</button>
        </div>
      </div>

      {(activeTab === 'citizens' || activeTab === 'entities') && (
        <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm animate-in fade-in duration-300">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <div>
                <h3 className="text-3xl font-serif font-bold mb-2">
                    {activeTab === 'citizens' ? 'Gestion des Citoyens' : 'Registre des Acteurs'}
                </h3>
                <p className="text-xs text-gray-400 font-medium italic">
                    {activeTab === 'citizens' ? 'Modération et rôles administratifs.' : 'Institutions, Entreprises et Piliers économiques.'}
                </p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher un nom ou pseudo..." className="w-full bg-gray-50 border border-transparent py-4 pl-12 pr-6 rounded-2xl outline-none focus:bg-white focus:border-blue-100 transition-all font-bold text-sm shadow-inner" />
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Acteur</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Catégorie / Rôle</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Leviers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCitizens.length > 0 ? filteredCitizens.map(p => (
                    <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <img src={p.avatar_url || `https://picsum.photos/seed/${p.id}/100/100`} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase">@{p.pseudonym}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2">
                              {getCategoryIcon(p.category)}
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{p.category || 'Citoyen'}</span>
                           </div>
                           <select 
                             value={p.role} 
                             onChange={(e) => handleUpdateRole(p, e.target.value)}
                             className="bg-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-gray-100 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                           >
                             <option value="Membre">Membre</option>
                             <option value="Animateur">Animateur</option>
                             <option value="Modérateur">Modérateur</option>
                             <option value="Administrateur">Administrateur</option>
                             <option value="Gardien">Gardien</option>
                           </select>
                         </div>
                      </td>
                      <td className="py-6">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             p.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                             p.status === 'suspended' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                             'bg-rose-50 text-rose-600 border border-rose-100'
                         }`}>
                             {p.status || 'active'}
                         </span>
                      </td>
                      <td className="py-6 text-right">
                         <div className="flex justify-end gap-2">
                            {p.status !== 'active' && (
                                <button onClick={() => handleUpdateStatus(p, 'active')} title="Activer" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-all">
                                    <CheckCircle2 size={18} />
                                </button>
                            )}
                            {p.status !== 'suspended' && (
                                <button onClick={() => handleUpdateStatus(p, 'suspended')} title="Suspendre" className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 border border-amber-100 transition-all">
                                    <Ban size={18} />
                                </button>
                            )}
                            {p.status !== 'revoked' && (
                                <button onClick={() => handleUpdateStatus(p, 'revoked')} title="Révoquer définitivement" className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 border border-rose-100 transition-all">
                                    <UserX size={18} />
                                </button>
                            )}
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic">
                         Aucun acteur trouvé pour cette recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in slide-in-from-bottom-4">
           {[
             { label: "Population", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Sentiers en Attente", value: pendingQuests.length, icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
             { label: "Impact Global", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Entités Actives", value: profiles.filter(p => p.category && p.category !== UserCategory.CITIZEN).length, icon: Landmark, color: "text-purple-600", bg: "bg-purple-50" }
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
                       <button onClick={() => fetchData()} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                         <Check size={16} /> Approuver
                       </button>
                       <button onClick={() => fetchData()} className="flex-1 bg-white border border-rose-100 text-rose-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
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
                <h3 className="text-2xl font-serif font-bold flex items-center gap-3 text-blue-400"><Terminal /> SQL V3.3</h3>
                <button onClick={() => { navigator.clipboard.writeText(SQL_SCHEMA); addToast("SQL V3.3 Copié !", "success"); }} className="p-3 bg-white/10 rounded-xl hover:bg-white/20"><Copy size={18} /></button>
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
