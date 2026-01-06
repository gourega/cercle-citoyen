
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
  ArrowLeft
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
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;

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
            impactScore: profile.impact_score || 0,
            impact_score: profile.impact_score || 0
          };

          setSuccess(true);
          setTimeout(() => {
            onLogin(loggedInUser);
            navigate('/feed');
          }, 800);
        }
      } else {
        setError('Le service souverain est momentanément indisponible.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Erreur de connexion:", err);
      setError("Identifiants incorrects. Veuillez vérifier vos accès.");
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRealSupabase && supabase) {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#/auth?type=recovery`,
        });

        if (recoveryError) throw recoveryError;

        addToast("Le messager est en route ! Vérifiez vos emails.", "success");
        setSuccess(true);
        setTimeout(() => {
          setIsRecoveryMode(false);
          setSuccess(false);
          setLoading(false);
        }, 3000);
      }
    } catch (err: any) {
      setError("Échec de l'envoi de l'email de récupération.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center page-transition">
      
      {/* Texture de fond subtile */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="300" r="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
          <path d="M0 300H800M400 0V600" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <header className="relative z-20 pt-16 mb-16 flex flex-col items-center gap-8 text-center animate-in fade-in duration-1000">
        <Logo size={64} showText={true} variant="blue" />
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-xl shadow-blue-100">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Souveraineté .CI Active
            </span>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-300">Territoire Numérique Ivoirien</p>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-6xl md:text-9xl font-serif font-bold text-gray-900 leading-[1] mb-12 tracking-tighter">
            Penser.<br />
            <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-[12px]">Relier</span>.<br />
            Agir.
          </h1>

          <p className="text-gray-400 text-xl md:text-3xl max-w-3xl mx-auto mb-20 font-medium leading-relaxed">
            Le premier réseau social citoyen, éthique et souverain, dédié au progrès de la nation ivoirienne.
          </p>
        </div>

        {/* Section Connexion / Recouvrement */}
        <div id="login-section" className="w-full max-w-[540px] mb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 md:p-16 mb-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
              <Sparkles size={120} className="text-blue-600" />
            </div>
            
            <div className="text-left mb-12 relative z-10">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-3">
                {isRecoveryMode ? "Recouvrement" : "Le Cercle Citoyen"}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
                {isRecoveryMode ? "Accès de secours .CI" : "Portail d'accès officiel .CI"}
              </p>
            </div>

            {user ? (
              <div className="text-center py-6 relative z-10">
                <div className="w-24 h-24 rounded-3xl mx-auto mb-8 ring-8 ring-blue-50 overflow-hidden shadow-2xl">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                </div>
                <p className="text-gray-500 mb-8 font-medium italic text-lg">Heureux de vous revoir, citoyen {user.pseudonym}.</p>
                <Link to="/feed" className="w-full py-7 rounded-3xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-black transition-all">
                  Entrer dans la Cité <ArrowRight size={18} />
                </Link>
              </div>
            ) : isRecoveryMode ? (
              <form onSubmit={handlePasswordRecovery} className="space-y-6 relative z-10 animate-in slide-in-from-right-4">
                <p className="text-sm text-gray-500 mb-6 font-medium">Saisissez votre email citoyen pour recevoir un lien de réinitialisation.</p>
                
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="email"
                    required
                    disabled={loading || success}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email citoyen"
                    className="w-full bg-gray-50 border border-transparent py-7 pl-16 pr-6 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all font-bold disabled:opacity-50"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading || success}
                  className={`w-full py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl ${
                    success 
                      ? 'bg-emerald-500 text-white shadow-emerald-100' 
                      : 'bg-gray-900 text-white hover:bg-black shadow-gray-100 active:scale-95'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" /> : success ? <CheckCircle2 className="animate-in zoom-in" /> : "Envoyer le lien"}
                </button>

                <button 
                  type="button"
                  onClick={() => setIsRecoveryMode(false)}
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 tracking-widest transition-colors"
                >
                  <ArrowLeft size={14} /> Retour à la connexion
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in shake duration-300">
                    <AlertCircle size={18} className="shrink-0" /> {error}
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="email"
                    required
                    disabled={loading || success}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email citoyen"
                    className="w-full bg-gray-50 border border-transparent py-7 pl-16 pr-6 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all font-bold disabled:opacity-50"
                  />
                </div>

                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading || success}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    className="w-full bg-gray-50 border border-transparent py-7 pl-16 pr-16 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all font-bold disabled:opacity-50"
                  />
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={loading || success}
                  className={`w-full py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl ${
                    success 
                      ? 'bg-emerald-500 text-white shadow-emerald-100' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 active:scale-95'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" /> : success ? <CheckCircle2 className="animate-in zoom-in" /> : "Rejoindre l'Éveil"}
                </button>

                <div className="flex justify-center pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsRecoveryMode(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={12} /> Mot de passe oublié ?
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-xs font-bold tracking-tight">Pas encore membre du Cercle ?</p>
            <Link 
              to="/manifesto" 
              className="px-10 py-4 border border-gray-200 rounded-full text-gray-900 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-900 hover:text-white transition-all"
            >
              DÉCOUVRIR LE MANIFESTE
            </Link>
          </div>
        </div>

        {/* Statistiques d'Impact */}
        <section className="w-full mb-40 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 text-blue-600 shadow-inner">
                <Globe size={32} />
              </div>
              <h3 className="text-4xl font-serif font-bold text-gray-900 mb-2">100% .CI</h3>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hébergement Souverain</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
                <Zap size={32} />
              </div>
              <h3 className="text-4xl font-serif font-bold text-gray-900 mb-2">+45k</h3>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Points d'Impact</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 text-amber-600 shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-4xl font-serif font-bold text-gray-900 mb-2">Sûr</h3>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Confiance Citoyenne</p>
            </div>
        </section>

      </main>
    </div>
  );
};

export default LandingPage;
