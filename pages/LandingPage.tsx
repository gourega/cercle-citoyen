import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  Shield,
  ArrowLeft,
  Fingerprint,
  ShieldAlert,
  Crown,
  ChevronRight,
  Sparkles,
  Phone,
  ShieldCheck,
  Menu
} from 'lucide-react';
import Logo from '../Logo';
import { User, Role, UserCategory } from '../types';
import { CIRCLES_CONFIG } from '../constants';
import { supabase, isRealSupabase } from '../lib/supabase';
import { useToast } from '../App';

const LandingPage = ({ onLogin }: { onLogin: (user: User) => void, user: User | null }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRealSupabase && supabase) {
        const { data: authData, error: authError } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          if (profile) {
            const loggedInUser: User = {
              id: profile.id,
              name: profile.name,
              pseudonym: profile.pseudonym,
              email: profile.email,
              bio: profile.bio,
              role: profile.role as Role,
              category: (profile.category as UserCategory) || UserCategory.CITIZEN,
              interests: [],
              avatar: profile.avatar_url,
              impactScore: profile.impact_score || 0
            };
            onLogin(loggedInUser);
            addToast(`Content de vous revoir, ${profile.name}`, "success");
            navigate('/feed');
          }
        }
      } else {
        if (email === 'cerclecitoyenci@gmail.com' && password === 'sagesse225') {
            onLogin({ id: 'admin-local', name: 'Gardien', pseudonym: 'Gardien', bio: '', role: Role.SUPER_ADMIN, category: UserCategory.CITIZEN, interests: [], avatar: '' });
            navigate('/feed');
        } else {
            setError('Accès restreint. Identifiants invalides.');
            setLoading(false);
        }
      }
    } catch (err: any) {
      setError("Accès refusé. Vérifiez vos codes.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center">
      
      {/* HEADER INSTITUTIONNEL - AUCUN BANDEAU NE DOIT APPARAITRE AU-DESSUS */}
      <header className="w-full h-24 px-6 md:px-12 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-[100]">
        <Logo size={40} showText={true} variant="blue" />
        
        <nav className="hidden lg:flex items-center gap-12">
          {['La Vision', 'L\'Impact', 'Les Cercles', 'Le Conseil'].map((item) => (
            <button key={item} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors">
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate('/auth')}
             className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
           >
             ESPACE CITOYEN
           </button>
           <button className="lg:hidden p-3 bg-gray-50 rounded-xl text-gray-400">
             <Menu size={24} />
           </button>
        </div>
      </header>

      {/* SECTION HERO */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center px-6 py-20">
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl border border-white/10 shadow-2xl">
              <Shield size={18} className="text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.5em]">
                SOUVERAINETÉ .CI CERTIFIÉE
              </span>
           </div>
        </div>

        <div className="w-full max-w-[580px] animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="bg-white rounded-[4.5rem] shadow-prestige border-2 border-gray-50 p-10 md:p-20 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
              <Fingerprint size={600} className="text-blue-600" />
            </div>
            
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-5xl font-serif font-bold text-slate-900 mb-6 tracking-tight">Authentification</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-600">PORTAIL CITOYEN SÉCURISÉ</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-10 relative z-10">
              {error && <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-600 text-xs font-bold animate-in shake"><AlertCircle size={22} /> {error}</div>}
              
              <div className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Identifiant (Email)" 
                    className="w-full bg-slate-50/50 border-2 border-transparent py-9 pl-20 pr-9 rounded-[2.5rem] outline-none focus:bg-white focus:border-blue-200 transition-all font-bold text-lg placeholder:text-slate-300 text-slate-800" 
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Code Secret" 
                    className="w-full bg-slate-50/50 border-2 border-transparent py-9 pl-20 pr-24 rounded-[2.5rem] outline-none focus:bg-white focus:border-blue-100 transition-all font-bold text-lg placeholder:text-slate-300 text-slate-800" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={26} /> : <Eye size={26} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-9 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-3xl hover:bg-slate-900 transition-all flex items-center justify-center gap-5">
                {loading ? <Loader2 className="animate-spin" size={28} /> : "ENTRER DANS LE CERCLE"}
              </button>

              <div className="flex flex-col items-center gap-6 pt-4">
                <button type="button" onClick={() => navigate('/auth')} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-3">
                  <ShieldAlert size={16} /> CRÉER UN ACCÈS CITOYEN
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full pt-24 pb-16 bg-white border-t border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 mb-20">
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8">
              <Logo size={42} showText={true} variant="blue" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 leading-relaxed max-w-sm">
                RÉSEAU SOCIAL CITOYEN ENGAGÉ POUR LA SOUVERAINETÉ NUMÉRIQUE IVOIRIENNE.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-6 h-0.5 bg-blue-600"></span> CONTACT
              </h3>
              <p className="text-sm font-bold text-gray-500">cerclecitoyenci@gmail.com</p>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-6 h-0.5 bg-blue-600"></span> LÉGAL
              </h3>
              <div className="flex flex-col space-y-4">
                <button onClick={() => navigate('/legal')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors text-left">CGU & CONFIDENTIALITÉ</button>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-gray-50 flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">© 2025 CERCLE CITOYEN</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;