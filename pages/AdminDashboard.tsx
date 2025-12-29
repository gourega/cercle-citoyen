
import React, { useState, useEffect } from 'react';
import { 
  Crown, ShieldCheck, Loader2, Activity, Database, CheckCircle2, AlertCircle,
  Terminal, Copy, RefreshCw, Server, Users, Settings, ChevronDown, Wifi, WifiOff, Code,
  ShieldAlert, Key
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

  const SQL_SCHEMA = `-- 1. COPIEZ CE CODE
-- 2. COLLEZ-LE DANS LE "SQL EDITOR" DE SUPABASE (Icône >_ en bas à gauche)
-- 3. CLIQUEZ SUR "RUN"

-- Création de la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    name TEXT,
    pseudonym TEXT,
    bio TEXT,
    avatar_url TEXT,
    impact_score INTEGER DEFAULT 0,
    email TEXT,
    role TEXT DEFAULT 'Membre',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité simples
CREATE POLICY "Tout le monde peut voir les profils" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Chaque citoyen peut modifier son propre profil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ajout des colonnes si la table existe déjà
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS pseudonym TEXT;
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
      } catch(e) {}
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
      
      {!isRealSupabase && (
        <div className="mb-12 bg-rose-50 border-2 border-rose-200 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-xl">
          <Key className="w-12 h-12 text-rose-600 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-rose-900 mb-2">Clé API Incorrecte détectée</h2>
            <p className="text-rose-700 font-medium">
              Vérifiez que vous utilisez la clé <b>anon / public</b> (ou <b>publishable</b>). <br/>
              Les clés commençant par <b>sb_secret_</b> sont interdites dans le navigateur.
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
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button onClick={() => setActiveTab('system')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest ${activeTab === 'system' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Configuration</button>
          <button onClick={() => setActiveTab('stats')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Données</button>
        </div>
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-2xl font-serif font-bold flex items-center gap-3"><Wifi className="text-blue-600" /> Diagnostic</h3>
               <button onClick={initDiagnostic} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
             </div>

             <div className={`p-8 rounded-[2rem] border-2 mb-8 flex items-center gap-6 ${connStatus?.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                {connStatus?.ok ? <CheckCircle2 className="text-emerald-500 w-12 h-12" /> : <ShieldAlert className="text-rose-500 w-12 h-12" />}
                <div>
                   <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-1">Status Liaison</p>
                   <p className={`text-sm font-bold ${connStatus?.ok ? 'text-emerald-800' : 'text-rose-800'}`}>{connStatus?.message || 'Vérification...'}</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                   <span className="text-[10px] font-black uppercase text-gray-400">URL API</span>
                   <span className="font-mono text-[10px] font-bold">https://nfsskgcpqbccnwacsplc.supabase.co</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                   <span className="text-[10px] font-black uppercase text-gray-400">Clé Publique</span>
                   <span className="font-mono text-[10px] font-bold">{isRealSupabase ? 'DÉTECTÉE ✅' : 'INVALIDE ❌'}</span>
                </div>
             </div>
          </section>

          <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl">
             <h3 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3 text-blue-400"><Terminal /> SQL Editor</h3>
             <p className="text-slate-400 text-sm mb-8 leading-relaxed">Exécutez ce script sur Supabase pour préparer la structure de votre base.</p>
             <div className="bg-black/40 p-6 rounded-2xl border border-white/10 relative font-mono text-[10px] leading-relaxed mb-8">
                <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap">{SQL_SCHEMA}</pre>
                <button onClick={() => copyToClipboard(SQL_SCHEMA)} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl"><Copy size={18} /></button>
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
