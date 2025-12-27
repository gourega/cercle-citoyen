
import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Loader2, 
  Activity, 
  Database, 
  Github, 
  CheckCircle2, 
  AlertCircle,
  Rocket,
  Terminal,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  Users,
  Zap,
  Info,
  Wrench,
  GitBranch,
  Settings,
  Layout,
  Search,
  UserPlus,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';
import { Role, User } from '../types.ts';

const APP_VERSION = "1.3.0-STABLE";

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'stats' | 'deploy' | 'citizens'>('citizens');
  const [dbStats, setDbStats] = useState({ profiles: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [envStatus, setEnvStatus] = useState({
    api: !!process.env.API_KEY,
    supabase: !!process.env.VITE_SUPABASE_URL
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isRealSupabase && supabase) {
          const { count: profs } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const { count: posts } = await supabase.from('posts').select('*', { count: 'exact', head: true });
          setDbStats({ profiles: profs || 0, posts: posts || 0 });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,pseudonym.ilike.%${searchQuery}%`)
          .limit(5);
        
        if (error) throw error;
        setSearchResults(data || []);
      } else {
        // Fallback local registry search
        const registry = JSON.parse(localStorage.getItem('cercle_registry') || '{}');
        const results = Object.values(registry).filter((u: any) => 
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.pseudonym?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
      }
    } catch (e) {
      addToast("Erreur de recherche", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const updateCitizenRole = async (userId: string, newRole: Role) => {
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId);
        if (error) throw error;
      }
      
      // Mise à jour du registre local pour la persistance démo
      const registry = JSON.parse(localStorage.getItem('cercle_registry') || '{}');
      registry[userId] = { ...(registry[userId] || {}), role: newRole };
      localStorage.setItem('cercle_registry', JSON.stringify(registry));

      // Mettre à jour les résultats de recherche locaux pour refléter le changement
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      addToast(`Rôle mis à jour : ${newRole}`, "success");
    } catch (e) {
      addToast("Erreur lors de l'attribution du rôle", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("Commande copiée !", "success");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
        <div className="flex items-center gap-8">
           <div className="w-24 h-24 rounded-[2.5rem] bg-gray-900 flex items-center justify-center shadow-2xl shadow-blue-200 ring-8 ring-blue-50">
             <Crown className="w-12 h-12 text-amber-500" />
           </div>
           <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-5xl font-serif font-bold text-gray-900">Conseil du Gardien</h1>
               <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                 v{APP_VERSION}
               </span>
            </div>
            <p className="text-gray-500 max-w-lg font-medium">Administration souveraine de l'infrastructure et de la hiérarchie citoyenne.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-2 rounded-2xl border border-gray-200 overflow-x-auto no-scrollbar shadow-inner">
          {(['stats', 'deploy', 'citizens'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              {tab === 'stats' ? 'Statistiques' : tab === 'deploy' ? 'Déploiement' : 'Citoyens'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'citizens' && (
        <div className="space-y-12">
          <section className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-gray-900">Gérer l'Identité Citoyenne</h3>
                  <p className="text-sm text-gray-400 font-medium">Promouvoir des membres et déléguer la sagesse.</p>
                </div>
             </div>

             <div className="max-w-xl mb-12 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Rechercher par nom ou pseudonyme..." 
                  className="w-full bg-gray-50 border border-transparent py-5 pl-16 pr-40 rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all font-medium"
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-3 top-3 bottom-3 bg-gray-900 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="animate-spin w-4 h-4" /> : "Rechercher"}
                </button>
             </div>

             <div className="space-y-4">
               {searchResults.length > 0 ? (
                 searchResults.map((citizen) => (
                   <div key={citizen.id} className="p-6 bg-gray-50 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                     <div className="flex items-center gap-4">
                       <img src={citizen.avatar_url || `https://picsum.photos/seed/${citizen.id}/100/100`} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                       <div>
                         <h4 className="font-bold text-gray-900">{citizen.name}</h4>
                         <p className="text-xs text-gray-400 font-medium">@{citizen.pseudonym}</p>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-4">
                       <div className="relative">
                          <select 
                            value={citizen.role}
                            onChange={(e) => updateCitizenRole(citizen.id, e.target.value as Role)}
                            className="appearance-none bg-white border border-gray-200 py-3 pl-6 pr-12 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                          >
                            {Object.values(Role).map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                       </div>
                       <div className={`p-3 rounded-xl ${citizen.role === Role.SUPER_ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                         {citizen.role === Role.SUPER_ADMIN ? <Crown size={18} /> : <ShieldCheck size={18} />}
                       </div>
                     </div>
                   </div>
                 ))
               ) : searchQuery && !isSearching ? (
                 <div className="text-center py-12 text-gray-400">
                    <Users className="mx-auto mb-4 opacity-20" size={48} />
                    <p className="text-sm font-bold uppercase tracking-widest">Aucun citoyen trouvé</p>
                 </div>
               ) : null}
             </div>
          </section>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Guide Correction Erreur MIME / Vite */}
            <div className="bg-blue-600 text-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none -rotate-12 group-hover:rotate-0 transition-transform"><Layout size={200} /></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-white/20 rounded-[1.25rem] flex items-center justify-center">
                       <Rocket className="text-white" />
                    </div>
                    <h3 className="text-3xl font-serif font-bold tracking-tight">Configuration Cloudflare Obligatoire</h3>
                  </div>
                  
                  <p className="text-blue-100 mb-10 max-w-xl leading-relaxed">
                    Votre erreur <span className="font-bold text-white underline">application/octet-stream</span> vient du fait que Cloudflare essaie de servir les fichiers sources sans les compiler.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">Build Command</p>
                       <p className="font-mono text-lg font-bold">npm run build</p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">Build Output Directory</p>
                       <p className="font-mono text-lg font-bold">dist</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <a 
                       href="https://dash.cloudflare.com/" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="px-10 py-5 bg-white text-blue-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl"
                     >
                       Corriger sur Cloudflare
                     </a>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12 transition-transform group-hover:scale-110"><Github size={200} /></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10">
                    <Terminal className="text-blue-400" />
                    <h3 className="text-2xl font-serif font-bold tracking-tight">Push Final du Gardien</h3>
                  </div>
                  
                  <div className="space-y-6 mb-12">
                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                      <code className="text-blue-400 text-sm">git add . && git commit -m "✨ Polissage: Fin de l'éveil"</code>
                      <button onClick={() => copyToClipboard(`git add . && git commit -m "✨ Polissage: Fin de l'éveil"`)} className="p-2 text-slate-500 hover:text-white transition-colors"><Copy size={18}/></button>
                    </div>
                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex justify-between items-center bg-emerald-500/5 hover:border-emerald-500/50 transition-colors">
                      <code className="text-emerald-400 font-bold text-sm">git push -u origin main --force</code>
                      <button onClick={() => copyToClipboard('git push -u origin main --force')} className="p-2 text-slate-500 hover:text-white transition-colors"><Copy size={18}/></button>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <aside className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm border-t-4 border-t-blue-500">
               <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-3"><Settings className="text-blue-500" /> État des Services</h3>
               <div className="space-y-4">
                  <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${envStatus.api ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">API Gemini AI</span>
                    {envStatus.api ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${envStatus.supabase ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Supabase DB</span>
                    {envStatus.supabase ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
               </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
