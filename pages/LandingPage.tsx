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

const LandingPage = ({ onLogin, user }: { onLogin: (user: User) => void, user: User | null }) => {
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
            setError('Accès restreint. Vérifiez vos identifiants.');
            setLoading(false);
        }
      }
    } catch (err: any) {
      setError("Accès refusé. Vérifiez vos codes ou sollicitez le Conseil.");
      setLoading(false);
    }
  };

  const handleSolicitCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRealSupabase && supabase) {
        await supabase
          .from('profiles')
          .update({ status: 'recovery_requested' })
          .eq('email', email);
        
        setRecoverySuccess(true);
        addToast("Alerte de sécurité transmise au Conseil.", "success");
      } else {
        setRecoverySuccess(true);
      }
    } catch (err: any) {
      setError("Échec de la liaison avec le Conseil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center">
      
      {/* EN-TÊTE INSTITUTIONNELLE (HEADER) */}
      <header className="w-full h-24 px-6 md:px-12 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-[100] transition-all">
        <Logo size={36} showText={true} variant="blue" />
        
        <nav className="hidden lg:flex items-center gap-12">
          {['La Vision', 'L\'Impact', 'Les Cercles', 'Le Conseil'].map((item) => (
            <button 
              key={item} 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate('/auth')}
             className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
           >
             ESPACE CITOYEN
           </button>
           <button className="lg:hidden p-3 bg-gray-50 rounded-xl text-gray-400">
             <Menu size={20} />
           </button>
        </div>
      </header>

      {/* SECTION HERO & AUTHENTIFICATION */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-6 py-20">
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000 text-center">
           <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-3xl border border-white/10">
              <Shield size={18} className="text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.5em]">
                SOUVERAINETÉ .CI CERTIFIÉE
              </span>
           </div>
        </div>

        {/* Bloc d'Authentification Central */}
        <div className="w-full max-w-[580px] animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className={`bg-white rounded-[4.5rem] shadow-prestige border-2 p-10 md:p-20 relative overflow-hidden group transition-all duration-700 ${isRecoveryMode ? 'border-amber-100 shadow-amber-50' : 'border-gray-50'}`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] group-hover:scale-110 transition-transform duration-[3000ms] pointer-events-none">
              <Fingerprint size={600} className={isRecoveryMode ? "text-amber-600" : "text-blue-600"} />
            </div>
            
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-5xl font-serif font-bold text-slate-900 mb-6 tracking-tight">
                {isRecoveryMode ? "Sécurité" : "Authentification"}
              </h2>
              <p className={`text-[11px] font-black uppercase tracking-[0.5em] ${isRecoveryMode ? 'text-amber-600' : 'text-blue-600'}`}>
                {isRecoveryMode ? "INTERVENTION MANUELLE DU CONSEIL" : "PORTAIL CITOYEN SÉCURISÉ"}
              </p>
            </div>

            {recoverySuccess ? (
              <div className="text-center animate-in zoom-in duration-500 space-y-10 relative z-10">
                <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-600 mx-auto shadow-inner">
                  <ShieldAlert size={48} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-serif font-bold text-slate-900">Demande Enregistrée</h3>
                  <p className="text-slate-500 leading-relaxed font-medium text-lg px-4">
                    Le Gardien a été alerté. Une vérification humaine sera effectuée sous peu pour restaurer votre accès.
                  </p>
                </div>
                <button onClick={() => { setIsRecoveryMode(false); setRecoverySuccess(false); }} className="w-full py-8 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl">
                  RETOUR À L'ENTRÉE
                </button>
              </div>
            ) : (
              <form onSubmit={isRecoveryMode ? handleSolicitCouncil : handleLogin} className="space-y-10 relative z-10">
                {error && <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-600 text-xs font-bold animate-in shake"><AlertCircle size={22} /> {error}</div>}
                
                <div className="space-y-6">
                  <div className="relative group">
                    <Mail className={`absolute left-9 top-1/2 -translate-y-1/2 transition-colors ${isRecoveryMode ? 'text-amber-400' : 'text-slate-400'}`} size={22} />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder={isRecoveryMode ? "Votre Email à débloquer" : "Identifiant (Email)"} 
                      className={`w-full bg-slate-50/50 border-2 py-8 pl-20 pr-9 rounded-[2.5rem] outline-none transition-all font-bold text-lg placeholder:text-slate-300 text-slate-800 ${isRecoveryMode ? 'border-amber-100 focus:bg-white focus:border-amber-300' : 'border-transparent focus:bg-white focus:border-blue-200'}`} 
                    />
                  </div>

                  {!isRecoveryMode && (
                    <div className="relative group">
                      <Lock className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={22} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Code Secret" 
                        className="w-full bg-slate-50/50 border-2 border-transparent py-8 pl-20 pr-24 rounded-[2.5rem] outline-none focus:bg-white focus:border-blue-100 transition-all font-bold text-lg placeholder:text-slate-300 text-slate-800" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff size={26} /> : <Eye size={26} />}
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className={`w-full py-9 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-5 shadow-3xl active:scale-95 disabled:opacity-50 ${isRecoveryMode ? 'bg-amber-600 shadow-amber-200/50 hover:bg-amber-700' : 'bg-blue-600 shadow-blue-200/50 hover:bg-slate-950'} text-white`}>
                  {loading ? <Loader2 className="animate-spin" size={28} /> : isRecoveryMode ? "SOLLICITER LE CONSEIL" : "ENTRER DANS LE CERCLE"}
                </button>

                <div className="flex flex-col items-center gap-6 pt-4">
                  <button type="button" onClick={() => setIsRecoveryMode(!isRecoveryMode)} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-3 group">
                    {isRecoveryMode ? <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> : <ShieldAlert size={16} />} 
                    {isRecoveryMode ? "RETOUR À LA CONNEXION" : "INTERVENTION DU CONSEIL (ACCÈS BLOQUÉ)"}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="mt-16 text-center animate-in fade-in delay-700">
             <p className="text-slate-400 text-sm font-medium italic mb-8">"L'engagement citoyen est le moteur du progrès social."</p>
             <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-4 text-blue-600 font-black text-[12px] uppercase tracking-[0.3em] hover:translate-x-2 transition-all">
                Demander un profil citoyen <ChevronRight size={18} />
             </button>
          </div>
        </div>

        <div className="absolute inset-0 -z-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/woven.png')]"></div>
      </section>

      {/* SECTION SLOGAN MAJESTUEUX */}
      <section className="w-full py-48 bg-white flex flex-col items-center text-center">
        <h2 className="text-6xl md:text-9xl font-serif font-bold text-slate-900 tracking-tighter animate-float">
          Penser. Relier. <span className="text-blue-600">Agir.</span>
        </h2>
        <div className="mt-12 w-32 h-2 bg-blue-600 rounded-full"></div>
      </section>

      {/* SECTION ÉCOSYSTÈME (AVANT LE PIED DE PAGE) */}
      <section className="w-full max-w-7xl px-8 py-32 border-t border-slate-50">
        <div className="text-center mb-24">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] mb-8 shadow-inner">
            <Sparkles size={32} />
          </div>
          <h2 className="text-5xl font-serif font-bold text-slate-900 mb-6 tracking-tight">L'Écosystème du Cercle</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-xl leading-relaxed font-medium italic">
            "Le progrès ne se décrète pas, il se tisse cercle par cercle." Explorez nos 12 piliers thématiques.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {CIRCLES_CONFIG.map((circle, i) => (
            <div 
              key={i} 
              className="group bg-white border border-slate-100 rounded-[3.5rem] p-12 hover:shadow-prestige hover:border-blue-100 transition-all duration-700 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 ${circle.color.split(' ')[1]}`}>
                 {React.cloneElement(circle.icon as React.ReactElement<any>, { size: 160 })}
              </div>
              <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center mb-10 shadow-inner ${circle.color}`}>
                {circle.icon}
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-5">{circle.type}</h3>
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                {circle.description}
              </p>
              <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Secteur Actif</span>
                 <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={18} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PIED DE PAGE (CONFORME À VOTRE VISION) */}
      <footer className="w-full pt-24 pb-16 bg-white border-t border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 mb-20">
            
            {/* Colonne 1 : Logo & Vision */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8">
              <Logo size={42} showText={true} variant="blue" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 leading-relaxed max-w-sm">
                RÉSEAU SOCIAL CITOYEN ENGAGÉ POUR LA SOUVERAINETÉ NUMÉRIQUE ET LE PROGRÈS SOCIAL EN CÔTE D'IVOIRE.
              </p>
            </div>

            {/* Colonne 2 : Contact & Support */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-6 h-0.5 bg-blue-600"></span> CONTACT & SUPPORT
              </h3>
              <div className="space-y-5">
                <a href="mailto:cerclecitoyenci@gmail.com" className="flex items-center gap-4 group">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <Mail size={18} />
                  </div>
                  <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">cerclecitoyenci@gmail.com</span>
                </a>
                <a href="tel:+2252522001239" className="flex items-center gap-4 group">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    <Phone size={18} />
                  </div>
                  <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">+225 2522001239</span>
                </a>
              </div>
            </div>

            {/* Colonne 3 : Cadre Légal */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-6 h-0.5 bg-blue-600"></span> CADRE LÉGAL
              </h3>
              <div className="flex flex-col space-y-5">
                <button onClick={() => navigate('/legal')} className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors text-left">CGU</button>
                <button onClick={() => navigate('/legal')} className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors text-left">CONFIDENTIALITÉ</button>
                <button onClick={() => navigate('/legal')} className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors text-left">MENTIONS LÉGALES</button>
                <button onClick={() => navigate('/manifesto')} className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors text-left">MANIFESTE</button>
              </div>
            </div>

          </div>

          {/* Ligne de Copyright */}
          <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 text-blue-600/40">
              <ShieldCheck size={18} />
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">
                SOUVERAINETÉ NUMÉRIQUE IVOIRIENNE
              </p>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">
              © 2025 CERCLE CITOYEN • TOUS DROITS RÉSERVÉS
            </p>
          </div>
        </div>
      </footer>

      {/* BOUTON FLOTTANT DU GARDIEN */}
      <div className="fixed bottom-10 right-10 z-[200]">
        <button 
          onClick={() => navigate('/live-assembly')}
          className="w-20 h-20 bg-blue-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-prestige hover:scale-110 active:scale-95 transition-all group border-4 border-white/20"
        >
          <Crown size={32} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;