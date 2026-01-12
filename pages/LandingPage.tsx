import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Fingerprint, Loader2, Sparkles } from 'lucide-react';
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
    
    // Identifiants de secours pour forcer l'entrée
    if (email === 'cerclecitoyenci@gmail.com' && password === 'sagesse225') {
      setTimeout(() => {
        onLogin({
          id: 'admin',
          name: 'Le Gardien',
          pseudonym: 'Gardien',
          bio: 'Fondateur du Cercle',
          role: Role.SUPER_ADMIN,
          category: UserCategory.CITIZEN,
          interests: [],
          avatar: 'https://picsum.photos/seed/admin/200/200',
          impactScore: 19740
        });
        navigate('/feed');
      }, 800);
    } else {
      setTimeout(() => {
        addToast("Mode sécurisé : Identifiants non reconnus.", "error");
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Grille de fond technologique */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.1)] mb-4">
            <Shield className="text-blue-500 w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">
            CERCLE<span className="text-blue-500">.CI</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em]">
            Souveraineté • V3.0 • Action
          </p>
        </div>

        <div className="bg-[#11141b] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full flex items-center gap-2 shadow-lg shadow-blue-600/20">
            <Fingerprint size={12} className="text-white" />
            <span className="text-[9px] font-black uppercase text-white tracking-widest">Accès Prioritaire</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Identité Citoyenne</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@citoyen.ci" 
                  className="w-full bg-[#0a0c10] border border-white/5 py-5 pl-14 pr-6 rounded-2xl outline-none focus:border-blue-500/50 text-white font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Code de Sécurité</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#0a0c10] border border-white/5 py-5 pl-14 pr-6 rounded-2xl outline-none focus:border-blue-500/50 text-white font-medium transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} /> Entrer dans le Système</>}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => navigate('/auth')}
                className="text-[9px] font-black uppercase text-slate-600 hover:text-blue-500 tracking-[0.2em] transition-colors"
              >
                Initialiser un nouveau profil
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center gap-8 text-[9px] font-black uppercase text-slate-700 tracking-[0.3em]">
          <span>© 2025 CC-V3</span>
          <span className="text-blue-900">•</span>
          <span>Infrastructure Souveraine</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;