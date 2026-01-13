import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, Fingerprint, Loader2, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { User, Role, UserCategory } from '../types';
import { useToast } from '../App';

const LandingPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Identifiants Maîtres
    if (email === 'cerclecitoyenci@gmail.com' && password === 'sagesse225') {
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
        addToast("ACCÈS REFUSÉ - VÉRIFIEZ VOS CODES", "error");
        setLoading(false);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-12">
        <div className="text-center animate-in fade-in duration-1000">
          <div className="inline-flex p-6 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 mb-8">
            <Shield className="text-blue-500 w-20 h-20 animate-pulse" />
          </div>
          <h1 className="text-7xl font-black text-white tracking-tighter mb-4 font-serif">
            CERCLE<span className="text-blue-500">.CI</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium italic mb-10 leading-relaxed">
            "Souveraineté, Action, Destinée."
          </p>
        </div>

        {!showLogin ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <button 
              onClick={() => navigate('/manifesto')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-between shadow-2xl shadow-blue-900/40 group"
            >
              <div className="flex items-center gap-4">
                <BookOpen size={24} className="text-blue-200" />
                <span>Rejoindre le Cercle</span>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>

            <button 
              onClick={() => setShowLogin(true)}
              className="w-full bg-slate-900 hover:bg-black text-slate-300 p-8 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] border border-white/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <Lock size={24} />
                <span>Déjà membre</span>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="bg-[#11141b] border border-white/5 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-500">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Identification</h2>
               <button onClick={() => setShowLogin(false)} className="text-slate-500 hover:text-white text-xs font-black uppercase">Retour</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Identifiant Citoyen</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nom@citoyen.ci" 
                    className="w-full bg-[#0a0c10] border border-white/5 py-6 pl-16 pr-6 rounded-2xl outline-none focus:border-blue-500 text-white font-bold transition-all text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Code d'accès</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-[#0a0c10] border border-white/5 py-6 pl-16 pr-6 rounded-2xl outline-none focus:border-blue-500 text-white font-bold transition-all text-lg"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {loading ? "VÉRIFICATION..." : "ENTRER"}
              </button>
            </form>
          </div>
        )}

        <div className="text-center pt-10">
           <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.5em] leading-loose">
             Infrastructure Numérique Souveraine<br/>Fait en Côte d'Ivoire pour le progrès social
           </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;