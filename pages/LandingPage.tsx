
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  
  // INITIALISATION FORCÉE DEPUIS LE STOCKAGE
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(() => {
    return sessionStorage.getItem('pending_recovery') === 'true';
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ÉCOUTEUR AGRESSIF DES PARAMÈTRES D'URL
  useEffect(() => {
    const checkState = () => {
      const stored = sessionStorage.getItem('pending_recovery') === 'true';
      const urlHasToken = window.location.href.includes('access_token=') || window.location.hash.includes('access_token=');
      
      if ((stored || urlHasToken) && !isUpdatingPassword) {
        console.log("Landing: Activation du mode mise à jour mot de passe.");
        setIsUpdatingPassword(true);
        sessionStorage.setItem('pending_recovery', 'true');
      }
    };

    checkState();
    const interval = setInterval(checkState, 500); // Check très fréquent au début

    if (isRealSupabase && supabase) {
      const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((event: string) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsUpdatingPassword(true);
          sessionStorage.setItem('pending_recovery', 'true');
        }
      });
      return () => {
        clearInterval(interval);
        subscription.unsubscribe();
      };
    }

    return () => clearInterval(interval);
  }, [isUpdatingPassword]);

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
      setError("Identifiants incorrects.");
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
          redirectTo: window.location.origin, 
        });
        if (recoveryError) throw recoveryError;
        setSuccess(true);
        addToast("Le lien de secours est en route vers votre boîte mail.", "success");
        setIsRecoveryMode(false);
      }
    } catch (err: any) {
      setError("Échec de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRealSupabase && supabase) {
        const { error: updateError } = await (supabase.auth as any).updateUser({
          password: password
        });
        
        if (updateError) throw updateError;
        
        // SUCCÈS : On nettoie et on redirige
        sessionStorage.removeItem('pending_recovery');
        addToast("Accès sécurisé ! Vous allez être redirigé.", "success");
        
        const { data: { user: authUser } } = await (supabase.auth as any).getUser();
        if (authUser) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
          if (profile) {
            onLogin({
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
            });
            navigate('/feed');
          }
        }
      }
    } catch (err: any) {
      setError("Le lien a expiré. Redemandez un accès.");
    } finally {
      setLoading(false);
    }
  };

  const cancelUpdate = () => {
    sessionStorage.removeItem('pending_recovery');
    setIsUpdatingPassword(false);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center page-transition">
      <header className="relative z-20 pt-20 mb-20 flex flex-col items-center gap-10 text-center animate-in fade-in duration-1000">
        <Logo size={80} showText={true} variant={isUpdatingPassword ? "amber" : "blue"} />
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
            <Shield size={16} className={isUpdatingPassword ? "text-emerald-400" : "text-blue-400"} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              {isUpdatingPassword ? "SÉCURISATION EN COURS" : "SOUVERAINETÉ .CI CERTIFIÉE"}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center">
        <div className="w-full max-w-[540px] mb-40 animate-in fade-in slide-in-from-bottom-20 duration-1000">
          <div className={`bg-white rounded-[4rem] shadow-2xl border-4 p-10 md:p-20 relative overflow-hidden group transition-colors duration-500 ${isUpdatingPassword ? 'border-emerald-500/20' : 'border-gray-50'}`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
              <Fingerprint size={160} className={isUpdatingPassword ? "text-emerald-600" : "text-blue-600"} />
            </div>
            
            <div className="text-left mb-16 relative z-10">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                {isUpdatingPassword ? "Mise à Jour" : isRecoveryMode ? "Récupération" : "Authentification"}
              </h2>
              <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${isUpdatingPassword ? 'text-emerald-600' : 'text-blue-600'}`}>
                {isUpdatingPassword ? "DÉFINIR LE NOUVEAU MOT DE PASSE" : "PORTAIL CITOYEN SÉCURISÉ"}
              </p>
            </div>

            <form onSubmit={isUpdatingPassword ? handleFinalPasswordUpdate : isRecoveryMode ? handlePasswordRecovery : handleLogin} className="space-y-8 relative z-10">
              {error && <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center gap-4 text-rose-600 text-xs font-bold animate-in shake"><AlertCircle size={20} /> {error}</div>}
              
              <div className="space-y-4">
                {!isUpdatingPassword && (
                  <div className="relative group">
                    <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email citoyen" className="w-full bg-gray-50 border-2 border-transparent py-8 pl-18 pr-8 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" />
                  </div>
                )}

                {(isUpdatingPassword || !isRecoveryMode) && (
                  <div className="relative group">
                    <Lock className={`absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 transition-colors ${isUpdatingPassword ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-blue-500'}`} size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      autoFocus={isUpdatingPassword}
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder={isUpdatingPassword ? "Nouveau mot de passe" : "Mot de passe"} 
                      className="w-full bg-gray-50 border-2 border-transparent py-8 pl-18 pr-20 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">{showPassword ? <EyeOff size={22} /> : <Eye size={22} />}</button>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-3xl active:scale-95 disabled:opacity-50 ${isUpdatingPassword ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-100 hover:bg-black'} text-white`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : isUpdatingPassword ? "SÉCURISER L'ACCÈS" : isRecoveryMode ? "ENVOYER LE LIEN" : "REJOINDRE L'ÉVEIL"}
              </button>

              <div className="flex flex-col items-center gap-4 pt-4">
                {isUpdatingPassword ? (
                  <button type="button" onClick={cancelUpdate} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors">
                    ANNULER ET RETOURNER À L'ACCUEIL
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsRecoveryMode(!isRecoveryMode)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2">
                    {isRecoveryMode ? <ArrowLeft size={14} /> : <RefreshCw size={14} />} {isRecoveryMode ? "RETOUR" : "MOT DE PASSE OUBLIÉ ?"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
