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
  GitBranch
} from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';

const APP_VERSION = "1.2.6-STABLE";

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'stats' | 'deploy' | 'database'>('deploy');
  const [dbStats, setDbStats] = useState({ profiles: 0, posts: 0 });
  const [loading, setLoading] = useState(true);

  const [envStatus, setEnvStatus] = useState({
    api: !!process.env.API_KEY,
    supabase: !!process.env.VITE_SUPABASE_URL
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: profs } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: posts } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        setDbStats({ profiles: profs || 0, posts: posts || 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("Commande copiée !", "success");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
        <div className="flex items-center gap-8">
           <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-200 ring-8 ring-blue-50">
             <Crown className="w-12 h-12 text-white" />
           </div>
           <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-5xl font-serif font-bold text-gray-900">Conseil Suprême</h1>
               <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                 v{APP_VERSION}
               </span>
            </div>
            <p className="text-gray-500 max-w-lg font-medium">Centre de commandement du Gardien.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-2 rounded-2xl border border-gray-200 overflow-x-auto no-scrollbar">
          {(['stats', 'deploy', 'database'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              {tab === 'stats' ? 'Statistiques' : tab === 'deploy' ? 'Déploiement' : 'Données'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'deploy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Erreur refspec main fix */}
            <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] mb-8">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center">
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900">Correction : "refspec main does not match"</h3>
                    <p className="text-xs text-amber-700">Votre branche s'appelle probablement 'master'. Tapez ceci pour corriger :</p>
                  </div>
               </div>
               <div className="bg-black/5 p-5 rounded-2xl font-mono text-[12px] text-amber-900 border border-amber-200/50 space-y-2">
                  <p className="font-bold flex items-center justify-between group">
                    git branch -M main
                    <button onClick={() => copyToClipboard('git branch -M main')} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={14}/></button>
                  </p>
                  <p className="text-[10px] text-amber-600 italic">Ensuite, relancez le push ci-dessous.</p>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><Github size={200} /></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <Terminal className="text-blue-400" />
                    <h3 className="text-2xl font-serif font-bold">Protocole de Synchronisation</h3>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex justify-between items-center group">
                      <code className="text-blue-400 text-sm">git add . && git commit -m "v{APP_VERSION}"</code>
                      <button onClick={() => copyToClipboard(`git add . && git commit -m "v${APP_VERSION}"`)} className="p-2 text-slate-500 hover:text-white transition-colors"><Copy size={16}/></button>
                    </div>
                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex justify-between items-center bg-blue-500/5">
                      <code className="text-emerald-400 font-bold text-sm">git push -u origin main --force</code>
                      <button onClick={() => copyToClipboard('git push -u origin main --force')} className="p-2 text-slate-500 hover:text-white transition-colors"><Copy size={16}/></button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <a href="https://dash.cloudflare.com/" target="_blank" className="flex items-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl">
                      <ExternalLink size={18} /> Voir sur Cloudflare
                    </a>
                  </div>
               </div>
            </div>
          </div>

          <aside className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
               <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-3"><Activity className="text-blue-500" /> État Vital</h3>
               <div className="space-y-4">
                  <div className={`p-5 rounded-2xl border flex items-center justify-between ${envStatus.api ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">IA Gemini</span>
                    {envStatus.api ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div className={`p-5 rounded-2xl border flex items-center justify-between ${envStatus.supabase ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Supabase</span>
                    {envStatus.supabase ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
               </div>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <Users className="w-10 h-10 text-blue-600 mx-auto mb-6" />
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Citoyens Inscrits</p>
            <p className="text-5xl font-serif font-bold text-gray-900">{dbStats.profiles}</p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <Zap className="w-10 h-10 text-amber-500 mx-auto mb-6" />
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Actions Certifiées</p>
            <p className="text-5xl font-serif font-bold text-gray-900">{dbStats.posts}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;