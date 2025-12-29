
import React, { useState, useEffect } from 'react';
import { 
  Crown, ShieldCheck, Loader2, Activity, Database, CheckCircle2, AlertCircle,
  Terminal, Copy, RefreshCw, Server, Users, Settings, ChevronDown, Wifi, WifiOff, Code,
  ShieldAlert
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';
import { Role } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'system' | 'stats' | 'citizens'>('system');
  const [dbStats, setDbStats] = useState({ profiles: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const SQL_SCHEMA = `-- 1. COPIEZ CE CODE
-- 2. COLLEZ-LE DANS LE "SQL EDITOR" DE SUPABASE (Icône >_ en bas à gauche)
-- 3. CLIQUEZ SUR "RUN"

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS pseudonym TEXT;

-- Si vous avez des erreurs de pseudonyme, assurez-vous que la colonne existe.
`;

  const initDiagnostic = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) {
      try {
        const { count: profs } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: posts } = await supabase.from('posts').select('*', { count: 'exact', head: true });
        setDbStats({ profiles: profs || 0, posts: posts || 0 });
      } catch(e) {
        console.error("Erreur stats:", e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initDiagnostic();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("Script SQL copié !", "success");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-500">
      
      {/* Alerte si Supabase est mal configuré */}
      {!isRealSupabase && (
        <div className="mb-12 bg-rose-50 border-2 border-rose-200 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-xl animate-bounce">
          <ShieldAlert className="w-12 h-12 text-rose-600 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-rose-900 mb-2">Supabase n'est pas connecté !</h2>
            <p className="text-rose-700 font-medium mb-4">
              Les variables <b>VITE_SUPABASE_URL</b> ou <b>VITE_SUPABASE_ANON_KEY</b> sont absentes de votre environnement. 
              Le réseau fonctionne en mode "Démo Locale".
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
        <div className="flex items-center gap-8">
           <div className="w-20 h-20 rounded-3xl bg-gray-900 flex items-center justify-center shadow-xl">
             <Crown className="w-10 h-10 text-amber-500" />
           </div>
           <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900">Conseil du Gardien</h1>
            <p className="text-gray-500 font-medium">Gestion de l'infrastructure souveraine.</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
          <button 
            onClick={() => setActiveTab('system')}
            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}
          >
            Configuration Système
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}
          >
            État des Données
          </button>
          <button 
            onClick={() => setActiveTab('citizens')}
            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'citizens' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}
          >
            Citoyens
          </button>
        </div>
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Diagnostic de Connexion */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-2xl font-serif font-bold flex items-center gap-3">
                 <Wifi className="text-blue-600" /> Diagnostic Réseau
               </h3>
               <button onClick={initDiagnostic} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                 <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
               </button>
             </div>

             <div className={`p-8 rounded-[2rem] border-2 mb-8 flex items-center gap-6 ${connStatus?.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                {connStatus?.ok ? <CheckCircle2 className="text-emerald-500 w-12 h-12" /> : <WifiOff className="text-rose-500 w-12 h-12" />}
                <div>
                   <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-1">Status de la liaison Cloud</p>
                   <p className={`text-lg font-bold ${connStatus?.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
                     {connStatus ? connStatus.message : 'Vérification...'}
                   </p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">URL du Projet</span>
                   <span className="font-mono text-xs font-bold">{isRealSupabase ? 'DÉTECTÉE ✅' : 'MANQUANTE ❌'}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Clé API (Anon)</span>
                   <span className="font-mono text-xs font-bold">{isRealSupabase ? 'DÉTECTÉE ✅' : 'MANQUANTE ❌'}</span>
                </div>
             </div>
          </section>

          {/* Correctif SQL */}
          <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute -bottom-10 -right-10 opacity-5 transition-transform group-hover:scale-110">
               <Code className="w-64 h-64 text-white" />
             </div>
             
             <h3 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3 relative z-10">
               <Terminal className="text-blue-400" /> Correctif de Table (SQL)
             </h3>
             <p className="text-slate-400 mb-8 leading-relaxed relative z-10">
               Utilisez ce script pour ajouter les colonnes <b>avatar_url</b> et <b>impact_score</b> à votre table `profiles` si elles n'existent pas.
             </p>

             <div className="bg-black/40 p-6 rounded-2xl border border-white/10 relative font-mono text-xs leading-relaxed mb-8 group/code">
                <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap">{SQL_SCHEMA}</pre>
                <button 
                  onClick={() => copyToClipboard(SQL_SCHEMA)}
                  className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <Copy size={18} />
                </button>
             </div>

             <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 relative z-10">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[10px] text-amber-200 font-bold leading-tight">
                  Après avoir exécuté le SQL sur Supabase, déconnectez-vous et recréez un citoyen pour tester.
                </p>
             </div>
          </section>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <p className="text-4xl font-serif font-bold mb-2">{dbStats.profiles}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Citoyens enregistrés</p>
           </div>
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm text-center">
              <Database className="w-12 h-12 text-blue-600 mx-auto mb-6" />
              <p className="text-4xl font-serif font-bold mb-2">{dbStats.posts}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Publications totales</p>
           </div>
        </div>
      )}
      
      {activeTab === 'citizens' && (
         <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm text-center py-32">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Liste des citoyens bientôt disponible.</p>
         </div>
      )}
    </div>
  );
};

export default AdminDashboard;
