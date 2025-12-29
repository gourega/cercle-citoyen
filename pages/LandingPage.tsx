
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldCheck, 
  BookOpen, 
  Target, 
  Zap, 
  Globe, 
  ArrowRight, 
  Loader2, 
  ChevronRight,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  ShieldAlert
} from 'lucide-react';
import Logo from '../Logo.tsx';
import { CIRCLES_CONFIG } from '../constants.tsx';
import { User } from '../types.ts';
import { ADMIN_ID, MOCK_USERS } from '../lib/mocks.ts';

const PulsePoint = ({ x, y, city, action, color = "bg-blue-400" }: { x: string, y: string, city: string, action: string, color?: string }) => (
  <div 
    className="absolute group z-20" 
    style={{ left: x, top: y }}
  >
    <div className={`absolute -inset-2 rounded-full ${color} opacity-20 animate-ping`}></div>
    <div className={`w-3 h-3 ${color} rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] cursor-pointer transition-transform group-hover:scale-150`}></div>
    
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto translate-y-2 group-hover:translate-y-0">
      <div className="bg-gray-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-left">
        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{city}</p>
        <p className="text-white text-[11px] leading-relaxed font-medium">{action}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/10 rotate-45 -mt-1"></div>
      </div>
    </div>
  </div>
);

const LandingPage = ({ onLogin, user }: { onLogin: (user: User) => void, user: User | null }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (email === 'cerclecitoyenci@gmail.com') {
        setSuccess(true);
        setTimeout(() => {
          const adminUser = MOCK_USERS[ADMIN_ID];
          onLogin(adminUser);
          navigate('/feed');
        }, 800);
      } else {
        setError('Identifiants incorrects. Pour les tests, utilisez : cerclecitoyenci@gmail.com');
        setLoading(false);
      }
    }, 1200);
  };

  const handleCircleClick = (circleType: string) => {
    if (user) {
      // Si connecté : direct vers le cercle
      navigate(`/circle/${encodeURIComponent(circleType)}`);
    } else {
      // Si visiteur : passage obligatoire par le Manifeste (Éveil)
      navigate('/manifesto');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center page-transition">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="300" r="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
          <path d="M0 300H800M400 0V600" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <header className="relative z-20 pt-16 mb-16 flex flex-col items-center gap-8 text-center animate-in fade-in duration-1000">
        <Logo size={60} showText={true} variant="blue" />
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-5 py-2.5 rounded-full shadow-sm">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
            Souveraineté numérique ivoirienne
          </span>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-8xl font-serif font-bold text-gray-900 leading-[1.05] mb-10 tracking-tighter">
            Un espace pour <br />
            <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-[12px]">penser</span>, relier et <br />
            agir.
          </h1>

          <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
            Rejoignez une communauté de citoyens engagés pour un dialogue mature et tourné vers le progrès social de notre nation.
          </p>
        </div>

        {/* Login Card */}
        <div id="login-section" className="w-full max-w-[540px] mb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          <div className="bg-white rounded-[4rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] border border-gray-100 p-10 md:p-16 mb-10">
            <div className="text-left mb-12">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-3">Accès au Cercle</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Saisissez vos identifiants citoyens</p>
            </div>

            {user ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-8 font-medium italic">Vous êtes déjà reconnu par le Cercle, citoyen.</p>
                <Link to="/feed" className="w-full py-6 rounded-[2rem] bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 flex items-center justify-center gap-3">
                  Entrer dans la Cité <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in shake duration-300">
                    <AlertCircle size={18} /> {error}
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
                    className="w-full bg-gray-50 border border-transparent py-6 pl-16 pr-6 rounded-3xl outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all font-bold disabled:opacity-50"
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
                    className="w-full bg-gray-50 border border-transparent py-6 pl-16 pr-16 rounded-3xl outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all font-bold disabled:opacity-50"
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
                  className={`w-full py-7 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    success 
                      ? 'bg-emerald-500 text-white shadow-emerald-100' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" /> : success ? <CheckCircle2 className="animate-in zoom-in" /> : "Se connecter"}
                </button>
              </form>
            )}
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-xs font-bold tracking-tight">Pas encore membre du Cercle ?</p>
            <Link 
              to="/manifesto" 
              className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] hover:text-blue-800 hover:underline transition-all underline-offset-4"
            >
              DÉBUTER MON ÉVEIL
            </Link>
          </div>
        </div>

        {/* Thematic Circles Section */}
        <section className="w-full mb-40 animate-in fade-in duration-1000 delay-500">
           <div className="flex flex-col items-center mb-20">
              <div className="inline-flex items-center gap-3 bg-gray-100 px-6 py-2 rounded-full mb-8">
                <LayoutGrid size={14} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Les Piliers de l'Éveil</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 mb-6">Nos Cercles d'Échanges.</h2>
              <p className="text-gray-400 max-w-xl text-lg font-medium leading-relaxed">
                Douze dimensions thématiques pour couvrir l'intégralité du progrès social ivoirien.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {CIRCLES_CONFIG.map((circle, i) => (
                <div 
                  key={i} 
                  onClick={() => handleCircleClick(circle.type)}
                  className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
                    {React.cloneElement(circle.icon as React.ReactElement<any>, { size: 120 })}
                  </div>
                  
                  <div className={`w-14 h-14 ${circle.color} rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500`}>
                    {React.cloneElement(circle.icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                  </div>
                  
                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">{circle.type}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-medium mb-6 line-clamp-3">
                    {circle.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    {user ? "Entrer dans le Cercle" : "Découvrir le Manifeste"} <ArrowRight size={14} />
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* Territory Map Section */}
        <section className="w-full bg-gray-950 rounded-[5rem] p-12 md:p-32 mb-32 text-left relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-3 bg-blue-900/30 border border-blue-800/50 px-6 py-2.5 rounded-full mb-10">
                <Globe size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Impact Territorial</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-10 leading-[1.1]">
                Votre Éveil <br />
                <span className="text-blue-400 italic">change</span> la Carte.
              </h2>
              
              <p className="text-gray-400 text-xl mb-14 max-w-md leading-relaxed font-medium">
                Chaque réflexion partagée allume une lumière. Chaque action certifiée éveille un territoire ivoirien.
              </p>
              
              <Link 
                to="/manifesto" 
                className="inline-flex items-center gap-4 bg-white text-gray-900 px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl group active:scale-95"
              >
                Découvrir le Manifeste <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-full blur-3xl opacity-50 animate-pulse"></div>
              <div className="w-full h-full bg-gray-900/50 rounded-[4rem] border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-inner">
                <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 text-gray-800 opacity-40 transition-opacity group-hover:opacity-60 duration-500">
                  <path d="M25 15 L35 12 L45 10 L60 12 L75 10 L85 15 L88 30 L85 45 L80 60 L85 75 L82 85 L75 90 L60 92 L45 95 L30 92 L20 88 L15 75 L12 60 L15 45 L18 30 L20 20 Z" fill="currentColor" />
                </svg>
                <PulsePoint x="72%" y="82%" city="Abidjan" action="Nettoyage collectif de la plage d'Anoumabo" />
                <PulsePoint x="52%" y="62%" city="Yamoussoukro" action="Installation de lampadaires solaires" color="bg-amber-400" />
                <PulsePoint x="55%" y="45%" city="Bouaké" action="Inauguration de la bibliothèque citoyenne" color="bg-emerald-400" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
