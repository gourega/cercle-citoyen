
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import { User, Role, UserCategory } from '../types.ts';
import { useToast } from '../ToastContext.tsx';
import Logo from '../Logo.tsx';

const GUARDIAN_UUID = '00000000-0000-0000-0000-000000000001';

const LandingPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (email === 'cerclecitoyenci@gmail.com' && password === 'sagesse225') {
      setTimeout(() => {
        onLogin({
          id: GUARDIAN_UUID,
          name: 'Kouassi G. Ouréga',
          pseudonym: 'Gardien',
          bio: 'Fondateur du Cercle V4. Garant de la cohésion et de la souveraineté numérique.',
          role: Role.SUPER_ADMIN,
          category: UserCategory.CITIZEN,
          interests: ['Souveraineté', 'Gouvernance', 'Impact'],
          avatar: 'https://picsum.photos/seed/admin/200/200',
          impactScore: 19740
        });
        addToast("Bienvenue, Gardien. La cité est stable.", "success");
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
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-12 relative z-10">
        <div className="text-center flex flex-col items-center">
          <Logo size={60} variant="light" showText={false} className="mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight flex flex-col gap-1">
            <span>CERCLE</span>
            <span className="text-blue-500 italic">CITOYEN</span>
          </h1>
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.4em] inline-block">
            SOUVERAINETÉ NUMÉRIQUE
          </div>
        </div>

        <div className="bg-[#11141b]/80 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 shadow-2xl shadow-black/50">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Identifiant Citoyen</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@citoyen.ci" 
                  className="w-full bg-[#0a0c10]/50 border border-white/5 py-6 pl-16 pr-6 rounded-2xl outline-none focus:border-blue-500/50 text-white font-bold transition-all placeholder:text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Code de Sagesse</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#0a0c10]/50 border border-white/5 py-6 pl-16 pr-6 rounded-2xl outline-none focus:border-blue-500/50 text-white font-bold transition-all placeholder:text-slate-800"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "AUTHENTIFICATION..." : "ENTRER DANS LE CERCLE"}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => navigate('/auth')}
              className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 tracking-widest transition-colors"
            >
              Pas encore de compte ? Devenir Citoyen
            </button>
          </div>
        </div>

        <div className="text-center">
           <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em]">Penser • Relier • Agir</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
