import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ChevronRight, Fingerprint, Loader2 } from 'lucide-react';
import { User, Role, UserCategory } from '../types';
import { useToast } from '../App';

const LandingPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation rapide pour le test ou login admin par défaut
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
        addToast("Bienvenue, Gardien", "success");
        navigate('/feed');
      }, 800);
    } else {
      addToast("Identifiants incorrects ou mode démo.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
            <Shield className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">CERCLE <span className="text-blue-500">CITOYEN</span></h1>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-[0.4em]">Souveraineté • Action • Progrès</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="bg-slate-50 px-6 py-2 rounded-full border border-slate-100 flex items-center gap-2">
              <Fingerprint size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase text-slate-500">Accès Sécurisé .CI</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email Citoyen" 
                className="w-full bg-slate-50 border-none py-5 pl-14 pr-6 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Code Secret" 
                className="w-full bg-slate-50 border-none py-5 pl-14 pr-6 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Entrer dans le Cercle"}
            </button>

            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={() => navigate('/auth')}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 tracking-widest transition-colors"
              >
                Créer une identité citoyenne
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-12 text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em]">
          Version 2.0.0 • © 2025 Cercle Citoyen
        </p>
      </div>
    </div>
  );
};

export default LandingPage;