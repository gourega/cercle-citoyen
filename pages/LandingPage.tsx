
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
  
  // Utilisation immédiate du SessionStorage pour forcer l'état avant même le premier render
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(() => {
    return sessionStorage.getItem('pending_recovery') === 'true';
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Détection de secours et nettoyage
  useEffect(() => {
    // Si on vient de charger et qu'on a le flag, on s'assure que Supabase a fini son setup
    if (isUpdatingPassword) {
      addToast("Sécurisation de l'accès activée.", "info");
    }

    if (!isRealSupabase || !supabase) return;

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: string) => {
      console.log("Landing Auth Event:", event);
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
        sessionStorage.setItem('pending_recovery', 'true');
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isUpdatingPassword, addToast]);

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
      if (err.message?.includes("Invalid login credentials")) {
        setError("Identifiants incorrects. Vérifiez votre email.");
      } else {
        setError("Liaison DB instable.");
      }
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRealSupabase && supabase) {
        // Redirection vers l'origine - App.tsx s'occupera de capter le token
        const redirectUrl = window.location.origin;
        const { error: recoveryError } = await (supabase.auth as any).resetPasswordForEmail(email, {
          redirectTo: redirectUrl, 
        });
        if (recoveryError) throw recoveryError;
        setSuccess(true);
        addToast("Le messager est en route vers votre email.", "success");
        setIsRecoveryMode(false);
      }
    } catch (err: any) {
      setError("Échec de l'envoi. Vérifiez l'adresse.");
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
        
        // SUCCÈS : On nettoie TOUT
        sessionStorage.removeItem('pending_recovery');
        addToast("Votre accès a été sécurisé !", "success");
        
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
          } else {
            setIsUpdatingPassword(false);
            navigate('/auth');
          }
        }
      }
    } catch (err: any) {
      setError("Le lien de sécurité a expiré.");
    } finally {
      setLoading(false);
    }
  };

  const cancelRecovery = () => {
    sessionStorage.removeItem('pending_recovery');
    setIsUpdatingPassword(false);
    setPassword('');
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center page-transition">
      <header className="relative z-20 pt-20 mb-20 flex flex-col items-center gap-10 text-center animate-in fade-in duration-1000">
        <Logo size={80} showText={true} variant="blue" />
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
            <Shield size={16} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Souveraineté .CI Certifiée
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center">
        <div className="w-full max-w-[540px] mb-40 animate-in fade-in slide-in-from-bottom-20 duration-1000">
          <div className={`bg-white rounded-[4rem] shadow-2xl border-2 p-10 md:p-20 relative overflow-hidden group ${isUpdatingPassword ? 'border-emerald-100' : 'border-gray-50'}`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
              <Fingerprint size={160} className={isUpdatingPassword ? "text-emerald-600" : "text-blue-600"} />
            </div>
            
            <div className="text-left mb-16 relative z-10">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                {isUpdatingPassword ? "Sécurisation" : isRecoveryMode ? "Accès de Secours" : "Authentification"}
              </h2>
              <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${isUpdatingPassword ? 'text-emerald-600' : 'text-blue-600'}`}>
                {isUpdatingPassword ? "Nouveau mot de passe citoyen" : "Portail Citoyen Sécurisé"}
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
                    <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      autoFocus={isUpdatingPassword}
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder={isUpdatingPassword ? "Définir nouveau mot de passe" : "Mot de passe"} 
                      className="w-full bg-gray-50 border-2 border-transparent py-8 pl-18 pr-20 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">{showPassword ? <EyeOff size={22} /> : <Eye size={22} />}</button>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className={`w-full py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-3xl active:scale-95 disabled:opacity-50 ${isUpdatingPassword ? 'bg-emerald-600 shadow-emerald-100' : 'bg-blue-600 shadow-blue-100'} text-white hover:bg-black`}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : isUpdatingPassword ? "SÉCURISER L'ACCÈS" : isRecoveryMode ? "ENVOYER LE LIEN" : "REJOINDRE L'ÉVEIL"}
              </button>

              <div className="flex flex-col items-center gap-4 pt-4">
                {!isUpdatingPassword && (
                  <button type="button" onClick={() => setIsRecoveryMode(!isRecoveryMode)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2">
                    {isRecoveryMode ? <ArrowLeft size={14} /> : <RefreshCw size={14} />} {isRecoveryMode ? "RETOUR" : "MOT DE PASSE OUBLIÉ ?"}
                  </button>
                )}
                {isUpdatingPassword && (
                  <button type="button" onClick={cancelRecovery} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors">
                    ANNULER ET RETOURNER À L'ACCUEIL
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
