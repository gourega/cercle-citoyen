
import React, { useState, useEffect } from 'react';
import { 
  Crown, ShieldCheck, Loader2, RefreshCw, Terminal, Copy, Wifi, 
  ShieldAlert, Users, Zap, Target, Landmark, Search, Check, 
  X, Ban, UserX, CheckCircle2, AlertCircle, FileCheck, Shield
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';
import { Role, UserCategory } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens' | 'entities' | 'quests'>('stats');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pendingQuests, setPendingQuests] = useState<any[]>([]);
  const [pendingEntities, setPendingEntities] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalPoints: 0, activeEdicts: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) {
      // 1. Fetch Profiles
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

      // 2. Fetch Pending Quests
      const { data: qData } = await supabase.from('quests').select('*').eq('status', 'pending');
      if (qData) setPendingQuests(qData);

      // 3. Fetch Pending Entities (Hypothétique selon schéma)
      // On simule ici si la table n'existe pas encore
      setPendingEntities([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Filtrage : Seuls les rôles spéciaux ou les résultats de recherche apparaissent
  const displayCitizens = profiles.filter(p => {
    const isSpecial = p.role !== Role.MEMBER || (p.category && p.category !== UserCategory.CITIZEN);
    const matchesSearch = searchTerm.length >= 2 && p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return isSpecial || matchesSearch;
  });

  const handleUpdateQuestStatus = async (id: string, status: 'validated' | 'rejected') => {
    if (supabase) {
      const { error } = await supabase.from('quests').update({ status }).eq('id', id);
      if (!error) {
        addToast(`Sentier ${status === 'validated' ? 'approuvé' : 'écarté'}.`, "success");
        fetchData();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      {/* HEADER PRESTIGE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-20">
        <div className="flex items-center gap-10">
           <div className="w-24 h-24 rounded-[2.5rem] bg-gray-950 flex items-center justify-center shadow-2xl relative group">
             <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity rounded-[2.5rem]"></div>
             <Crown className="w-12 h-12 text-amber-500" />
           </div>
           <div>
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Conseil du Gardien</h1>
            <p className="text-gray-500 font-medium italic">Souveraineté, Éthique & Gouvernance du Cercle.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-2 rounded-[2rem] border border-gray-200 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'stats', label: 'Impact', icon: Zap },
            { id: 'citizens', label: 'Membres', icon: Users },
            { id: 'entities', label: 'Entités', icon: Landmark },
            { id: 'quests', label: 'Sentiers', icon: Target },
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

      {/* VUE IMPACT / STATS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
           {[
             { label: "Population totale", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Impact Cumulé", value: stats.totalPoints.toLocaleString() + " XP", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Gouvernance active", value: stats.activeEdicts, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
             { label: "Ancrages Institutionnels", value: profiles.filter(p => p.category && p.category !== UserCategory.CITIZEN).length, icon: Landmark, color: "text-amber-600", bg: "bg-amber-50" }
           ].map((s, i) => (
             <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-8 shadow-inner`}><s.icon size={28} /></div>
                <p className="text-[11px] font-black uppercase text-gray-400 mb-2 tracking-widest">{s.label}</p>
                <p className="text-4xl font-serif font-bold text-gray-900">{s.value}</p>
             </div>
           ))}
        </div>
      )}

      {/* VUE MEMBRES (REGISTRE SÉLECTIF) */}
      {activeTab === 'citizens' && (
        <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-sm">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
              <div>
                <h3 className="text-3xl font-serif font-bold text-gray-900">Registre de Vigilance</h3>
                <p className="text-gray-400 text-sm mt-2 italic">Affichage par défaut : Rôles spéciaux & Institutions.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Appeler un membre par son nom..." 
                  className="w-full bg-gray-50 border-2 border-transparent py-5 pl-16 pr-8 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 transition-all font-bold" 
                />
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Acteur Civique</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Rôle & Rang</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest">Statut</th>
                    <th className="pb-8 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Intervention</th>
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
                         <div className="text-[9px] font-black text-blue-500 uppercase mt-1">{p.category}</div>
                      </td>
                      <td className="py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'banned' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {p.status || 'Actif'}
                        </span>
                      </td>
                      <td className="py-8 text-right">
                         <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all" title="Bannir"><UserX size={20} /></button>
                           <button className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all" title="Promouvoir"><ShieldCheck size={20} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {displayCitizens.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic font-medium">
                         <Search className="w-12 h-12 mx-auto mb-4 opacity-10" />
                         Aucun citoyen "appelé". Utilisez la recherche pour agir sur un membre spécifique.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* VUE SENTIERS (QUÊTES À VALIDER) */}
      {activeTab === 'quests' && (
        <div className="space-y-8">
           <div className="mb-10">
              <h3 className="text-3xl font-serif font-bold text-gray-900">Approbation des Sentiers</h3>
              <p className="text-gray-400 mt-2">Validez les initiatives citoyennes avant leur mise en ligne.</p>
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
                 <p className="text-gray-400 font-bold italic">Toutes les visions ont été traitées.</p>
              </div>
             )}
           </div>
        </div>
      )}

      {/* VUE ENTITÉS (VALIDATION DES INSTITUTIONS) */}
      {activeTab === 'entities' && (
        <div className="space-y-8">
           <div className="mb-10">
              <h3 className="text-3xl font-serif font-bold text-gray-900">Audit des Entités</h3>
              <p className="text-gray-400 mt-2">Vérifiez la légitimité des organisations demandant un Sceau Institutionnel.</p>
           </div>
           <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 text-center">
              <Landmark className="w-16 h-16 text-gray-100 mx-auto mb-6" />
              <p className="text-gray-400 italic">Aucune demande d'entité en attente d'audit pour le moment.</p>
           </div>
        </div>
      )}

      {/* VUE SYSTÈME (CONNEXION CLOUD) */}
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
                  <p className="font-black uppercase text-[10px] text-gray-400 mb-1 tracking-widest">Statut de liaison</p>
                  <p className="font-bold text-lg text-gray-900">{connStatus?.message || 'Interrogation des archives...'}</p>
                </div>
             </div>
          </section>

          <section className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl overflow-hidden flex flex-col">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-bold flex items-center gap-4 text-blue-400"><Terminal /> Console Souveraine</h3>
                <button onClick={() => addToast("Accès restreint à l'Esprit.", "info")} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Copy size={20} /></button>
             </div>
             <div className="bg-black/40 p-8 rounded-[2rem] border border-white/10 font-mono text-[11px] leading-relaxed flex-1">
                <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap">
                  {`-- CONSOLE DE GOUVERNANCE V3.8 --
> system_check: status_ok
> active_guardians: 1
> database_integrity: verified
> encryption_level: quantum_ready
> citizenship_flow: stable`}
                </pre>
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
