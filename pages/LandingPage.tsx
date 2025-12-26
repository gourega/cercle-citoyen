import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, BookOpen, Target, Zap, Globe, ArrowRight } from 'lucide-react';
import Logo from '../Logo.tsx';
import { CIRCLES_CONFIG } from '../constants.tsx';

/**
 * Composant pour les points d'action sur la carte
 */
const PulsePoint = ({ x, y, city, action, color = "bg-blue-400" }: { x: string, y: string, city: string, action: string, color?: string }) => (
  <div 
    className="absolute group z-20" 
    style={{ left: x, top: y }}
  >
    {/* Animation de pulsation */}
    <div className={`absolute -inset-2 rounded-full ${color} opacity-20 animate-ping`}></div>
    <div className={`w-3 h-3 ${color} rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] cursor-pointer transition-transform group-hover:scale-150`}></div>
    
    {/* Menu contextuel au survol (Tooltip) */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto translate-y-2 group-hover:translate-y-0">
      <div className="bg-gray-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{city}</p>
        <p className="text-white text-[11px] leading-relaxed font-medium">{action}</p>
        {/* Flèche du menu */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/10 rotate-45 -mt-1"></div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation pour la démo : accès direct à l'authentification
    if (email === 'cerclecitoyenci@gmail.com') {
      navigate('/auth');
    } else {
      setError('Identifiants incorrects ou compte non vérifié.');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-hidden flex flex-col items-center">
      
      {/* Décoration d'arrière-plan (grilles et cercles) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="300" r="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
          <path d="M0 300H800M400 0V600" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <header className="relative z-20 pt-16 mb-16 flex flex-col items-center gap-10 text-center animate-in fade-in duration-1000">
        <Logo size={56} showText={true} variant="blue" />
        <div className="inline-flex items-center gap-2 bg-[#f0fdf4] border border-[#dcfce7] px-5 py-2.5 rounded-full shadow-sm">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
            Souveraineté numérique ivoirienne
          </span>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center">
        {/* Hero Section */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#111827] leading-[1.1] mb-10">
            Un espace pour <br />
            <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-[12px]">penser</span>, relier et <br />
            agir.
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 font-medium">
            Rejoignez une communauté de citoyens engagés pour un dialogue mature et tourné vers le progrès social de notre nation.
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-[540px] mb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          <form onSubmit={handleLogin} className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 p-12 mb-8">
            <div className="text-left mb-10">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Accès au Cercle</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Saisissez vos identifiants citoyens</p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email citoyen"
                  className="w-full bg-gray-50 border border-transparent py-5 pl-16 pr-6 rounded-2xl outline-none focus:bg-white focus:border-blue-100 transition-all font-medium"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full bg-gray-50 border border-transparent py-5 pl-16 pr-16 rounded-2xl outline-none focus:bg-white focus:border-blue-100 transition-all font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
              >
                Se connecter
              </button>
            </div>
          </form>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-400 text-xs font-bold tracking-tight">Pas encore membre ?</p>
            <Link 
              to="/auth" 
              className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] hover:text-blue-800 transition-colors"
            >
              CRÉER UN COMPTE
            </Link>
          </div>
        </div>

        {/* Section Impact Territorial avec Carte Interactive */}
        <section className="w-full bg-gray-950 rounded-[4rem] p-12 md:p-24 mb-32 text-left relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-3 bg-blue-900/30 border border-blue-800/50 px-5 py-2 rounded-full mb-8">
                <Globe size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Impact Territorial</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 leading-tight">
                Votre Éveil <br />
                <span className="text-blue-400 italic">change</span> la Carte.
              </h2>
              
              <p className="text-gray-400 text-lg mb-12 max-w-md leading-relaxed">
                Le Cercle n'est pas un spectateur. Chaque réflexion partagée allume une lumière. Chaque action certifiée éveille un territoire ivoirien.
              </p>
              
              <div className="space-y-6 mb-12">
                <div className="bg-gray-900/80 border border-white/5 p-6 rounded-3xl flex items-center gap-6">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Puissance Citoyenne</p>
                    <p className="text-xl font-bold text-white">4,280 Points d'Impact collectés</p>
                  </div>
                </div>
                
                <div className="bg-gray-900/80 border border-white/5 p-6 rounded-3xl flex items-center gap-6">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Objectif National</p>
                    <p className="text-xl font-bold text-white">38% du Territoire éveillé</p>
                  </div>
                </div>
              </div>
              
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40 group"
              >
                Commencer ma quête <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Carte de la Côte d'Ivoire avec Pulses Géographiques */}
            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent rounded-full blur-3xl opacity-50"></div>
              <div className="w-full h-full bg-gray-900/50 rounded-[3rem] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                
                {/* Silhouette SVG de la Côte d'Ivoire */}
                <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 text-gray-800 opacity-40 transition-opacity group-hover:opacity-60 duration-500">
                  <path d="M25 15 L35 12 L45 10 L60 12 L75 10 L85 15 L88 30 L85 45 L80 60 L85 75 L82 85 L75 90 L60 92 L45 95 L30 92 L20 88 L15 75 L12 60 L15 45 L18 30 L20 20 Z" fill="currentColor" />
                </svg>

                {/* Pulses Géographiques placés aux positions approximatives */}
                {/* Abidjan (Sud-Est) */}
                <PulsePoint x="72%" y="82%" city="Abidjan" action="Nettoyage collectif de la plage d'Anoumabo" />
                
                {/* Yamoussoukro (Centre-Sud) */}
                <PulsePoint x="52%" y="62%" city="Yamoussoukro" action="Installation de lampadaires solaires communautaires" color="bg-amber-400" />
                
                {/* Bouaké (Centre) */}
                <PulsePoint x="55%" y="45%" city="Bouaké" action="Inauguration de la bibliothèque citoyenne" color="bg-emerald-400" />
                
                {/* San Pedro (Sud-Ouest) */}
                <PulsePoint x="28%" y="78%" city="San Pedro" action="Reforestation des abords du port" color="bg-blue-400" />
                
                {/* Odienné (Nord-Ouest) */}
                <PulsePoint x="25%" y="22%" city="Odienné" action="Formation à l'agriculture durable et résiliente" color="bg-emerald-400" />

                {/* Korhogo (Nord-Centre) */}
                <PulsePoint x="55%" y="20%" city="Korhogo" action="Atelier de tissage et transmission culturelle" color="bg-rose-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Bibliothèque de Sagesse */}
        <section className="w-full max-w-6xl mb-32">
           <header className="mb-16 text-center">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Bibliothèques de Sagesse</h2>
              <p className="text-gray-400 text-lg font-medium">Le savoir partagé est le premier rempart contre l'ignorance.</p>
           </header>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {CIRCLES_CONFIG.map((circle, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm hover:shadow-xl transition-all group text-left">
                   <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-10 shadow-xl shadow-blue-100">
                      <div className="text-white">
                        {circle.icon && React.isValidElement(circle.icon) 
                          ? React.cloneElement(circle.icon as any, { size: 28 }) 
                          : <BookOpen size={28} />
                        }
                      </div>
                   </div>
                   <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6 leading-tight group-hover:text-blue-600 transition-colors">
                      {circle.type}
                   </h3>
                   <p className="text-gray-500 text-base leading-relaxed font-medium">
                      {circle.description}
                   </p>
                </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;