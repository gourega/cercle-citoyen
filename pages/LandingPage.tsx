import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Fingerprint, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { User, Role, UserCategory } from '../types';
import { useToast } from '../App';

const LandingPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center">
          <div className="inline-flex p-5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Shield className="text-blue-500 w-16 h-16 animate-pulse" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-2">
            CERCLE<span className="text-blue-500">.CI</span>
          </h1>
          <div className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] inline-block">
            Souveraineté V4.0.0
          </div>
        </div>

        <div className="bg-[#11141b] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Identifiant</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@citoyen.ci" 
                  className="w-full bg-[#0a0c10] border border-white/5 py-6 pl-16 pr-6 rounded-2xl outline-none focus:border-blue-500 text-white font-bold transition-all"
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
                  className="w-full bg-[#0a0c10] border border-white/5 py-6 pl-16 pr-6 rounded-2xl outline-none focus:border-blue-500 text-white font-bold transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "CONNEXION..." : "ENTRER DANS LE CERCLE"}
            </button>
          </form>
        </div>

        <div className="text-center">
           <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.5em]">
             Infrastructure Souveraine Ivoirienne
           </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;