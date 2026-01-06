
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import Logo from '../Logo.tsx';
import { User, Role, UserCategory } from '../types.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';

const LandingPage = ({ onLogin, user }: { onLogin: (user: User) => void, user: User | null }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
            setSuccess(true);
            setTimeout(() => {
              onLogin(loggedInUser);
              navigate('/feed');
            }, 800);
          }
        }
      } else {
        setError('Mode démo actif. Utilisez un compte fictif.');
        setLoading(false);
      }
    } catch (err: any) {
      setError("Identifiants incorrects ou problème de liaison DNS.");
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRealSupabase && supabase) {
        const { error: recoveryError } = await (supabase.auth as any).resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#/auth?type=recovery`,
        });
        if (recoveryError) throw recoveryError;
        setSuccess(true);
        addToast("Le messager est en route vers votre email.", "success");
      }
    } catch (err: any) {
      setError("Échec de l'envoi. Vérifiez l'adresse email.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center page-transition">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]">
        <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="300" r="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
          <path d="M0 300H800M400 0V600" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <header className="relative z-20 pt-20 mb-20 flex flex-col items-center gap-10 text-center animate-in fade-in duration-1000">
        <Logo size={80} showText={true} variant="blue" />
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
            <Shield size={16} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Souveraineté .CI Certifiée
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300">Territoire d'Éveil Citoyen</p>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center">
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <h1 className="text-6xl md:text-[9rem] font-serif font-bold text-gray-900 leading-[0.9] mb-12 tracking-tighter">
            Penser.<br />
            <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-[16px]">Relier</span>.<br />
            Agir.
          </h1>
          <p className="text-gray-400 text-xl md:text-3xl max-w-4xl mx-auto mb-24 font-medium leading-relaxed">
            Bienvenue sur le domaine officiel <span className="text-gray-900 font-bold">cerclecitoyen.ci</span>. Le premier réseau souverain dédié à l'impact social ivoirien.
          </p>
        </div>

        <div className="w-full max-w-[540px] mb-40 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-300">
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 md:p-20 mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
              <Fingerprint size={160} className="text-blue-600" />
            </div>
            
            <div className="text-left mb-16 relative z-10">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                {isRecoveryMode ? "Accès de Secours" : "Authentification"}
              </h2>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600">
                Portail Citoyen Sécurisé
              </p>
            </div>

            {user ? (
              <div className="text-center py-10 relative z-10">
                <div className="w-32 h-32 rounded-[2.5rem] mx-auto mb-10 ring-[12px] ring-blue-50 overflow-hidden shadow-2xl transition-transform hover:scale-110 duration-500">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                </div>
                <p className="text-gray-500 mb-10 font-medium italic text-xl">Bon retour, {user.pseudonym}. La cité vous attend.</p>
                <Link to="/feed" className="w-full py-8 rounded-3xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-3xl shadow-blue-100 flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95">
                  ENTRER DANS LE CERCLE <ChevronRight size={18} />
                </Link>
              </div>
            ) : (
              <form onSubmit={isRecoveryMode ? handlePasswordRecovery : handleLogin} className="space-y-8 relative z-10">
                {error && <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center gap-4 text-rose-600 text-xs font-bold animate-in shake"><AlertCircle size={20} /> {error}</div>}
                
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email citoyen" className="w-full bg-gray-50 border-2 border-transparent py-8 pl-18 pr-8 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" />
                  </div>

                  {!isRecoveryMode && (
                    <div className="relative group">
                      <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-gray-50 border-2 border-transparent py-8 pl-18 pr-20 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">{showPassword ? <EyeOff size={22} /> : <Eye size={22} />}</button>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className="w-full py-8 rounded-[2rem] bg-blue-600 text-white font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-blue-100 hover:bg-black active:scale-95 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : isRecoveryMode ? "ENVOYER LE LIEN" : "REJOINDRE L'ÉVEIL"}
                </button>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <button type="button" onClick={() => setIsRecoveryMode(!isRecoveryMode)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2">
                    {isRecoveryMode ? <ArrowLeft size={14} /> : <RefreshCw size={14} />} {isRecoveryMode ? "RETOUR" : "MOT DE PASSE OUBLIÉ ?"}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <p className="text-gray-400 text-sm font-bold tracking-tight italic">Envie d'agir pour la nation ?</p>
            <Link to="/manifesto" className="px-12 py-5 border-2 border-gray-200 rounded-full text-gray-900 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm">
              LIRE LE MANIFESTE SOUVERAIN
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
