import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, BookOpen, ArrowRight, Sparkles, Loader2, Mail, RefreshCcw } from 'lucide-react';
import { User, Role, UserCategory } from '../types';
import { useToast } from '../App';
import Logo from '../Logo';

const LandingPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Identifiants Maîtres
    if (email === 'admin@cercle.ci' || (email === 'cerclecitoyenci@gmail.com' && password === 'sagesse225')) {
      setTimeout(() => {
        onLogin({
          id: 'admin',
          name: 'Kouassi G. Ouréga',
          pseudonym: 'Gardien',
          bio: 'Fondateur du Cercle V4',
          role: Role.SUPER_ADMIN,
          category: UserCategory.CITIZEN,
          interests: [],
          avatar: 'https://picsum.photos/seed/admin/200/200',
          impactScore: 19740
        });
        navigate('/feed');
      }, 1000);
    } else {
      setTimeout(() => {
        addToast("ACCÈS REFUSÉ - CODES INVALIDES", "error");
        setLoading(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-blue-600 relative">
      <div className="w-full max-w-xl space-y-12">
        
        <header className="text-center space-y-8 animate-in fade-in duration-1000">
          <Logo size={80} variant="light" showText={true} className="mb-4" />
          <p className="text-slate-400 text-xl font-serif italic leading-relaxed">
            "Souveraineté, Action, Destinée."
          </p>
        </header>

        {!showLogin ? (
          <div className="grid gap-6 animate-in slide-in-from-bottom-12 duration-700">
            <button 
              onClick={() => navigate('/manifesto')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-between shadow-2xl shadow-blue-900/40 group"
            >
              <div className="flex items-center gap-6">
                <BookOpen size={24} className="text-blue-200" />
                <span className="text-left">Rejoindre le Cercle</span>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>

            <button 
              onClick={() => setShowLogin(true)}
              className="w-full bg-slate-900 hover:bg-black text-slate-300 p-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] border border-white/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <Lock size={24} />
                <span className="text-left">Déjà Membre</span>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 shadow-3xl animate-in zoom-in duration-500">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Identification</h2>
               <button onClick={() => setShowLogin(false)} className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest">Retour</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Citoyen</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                  <input 
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="nom@cercle.ci" 
                    className="w-full bg-slate-950 border border-white/5 py-5 pl-14 pr-6 rounded-2xl outline-none focus:border-blue-500 text-white font-bold transition-all text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                  <input 
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-950 border border-white/5 py-5 pl-14 pr-6 rounded-2xl outline-none focus:border-blue-500 text-white font-bold transition-all text-base"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "VÉRIFICATION..." : "ENTRER DANS LE CERCLE"}
              </button>
            </form>
          </div>
        )}

        {/* Bouton de secours discret en bas */}
        <footer className="pt-12 text-center">
          <button 
            type="button"
            onClick={() => (window as any).forceClean()}
            className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] text-slate-700 hover:text-rose-500 transition-colors"
          >
            <RefreshCcw size={10} /> Réinitialiser l'application
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;