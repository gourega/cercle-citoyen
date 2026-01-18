
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Lock, Mail, Loader2, Sparkles, ArrowRight, 
  Target, Camera, Gavel, Video, Heart, ChevronDown,
  ShieldCheck, Globe, Zap
} from 'lucide-react';
import { User, Role, UserCategory } from '../types.ts';
import { useToast } from '../ToastContext.tsx';
import Logo from '../Logo.tsx';

const GUARDIAN_UUID = '00000000-0000-0000-0000-000000000001';

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col items-center text-center">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon className="text-white" size={28} />
    </div>
    <h3 className="font-serif font-bold text-xl mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const LandingPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (email === 'cerclecitoyenci@gmail.com' && password === 'sagesse225') {
      setTimeout(() => {
        onLogin({
          id: GUARDIAN_UUID,
          name: 'Kouassi G. Ouréga',
          pseudonym: 'Gardien',
          bio: 'Fondateur du Cercle V4. Garant de la cohésion et de la souveraineté numérique.',
          role: Role.SUPER_ADMIN,
          category: UserCategory.CITIZEN,
          interests: ['Souveraineté', 'Gouvernance', 'Impact'],
          avatar: 'https://picsum.photos/seed/admin/200/200',
          impactScore: 19740
        });
        addToast("Bienvenue, Gardien. La cité est stable.", "success");
        navigate('/feed');
      }, 1000);
    } else {
      setTimeout(() => {
        addToast("ACCÈS REFUSÉ - VÉRIFIEZ VOS CODES", "error");
        setLoading(false);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-gray-900 selection:bg-blue-100">
      {/* HEADER ELEGANT */}
      <header className="absolute top-0 inset-x-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-3xl shadow-sm">
          <Logo size={32} showText variant="blue" />
          <div className="hidden md:flex items-center gap-8">
             <a href="#features" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors">Vision</a>
             <a href="#login" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors">Connexion</a>
             <Link to="/auth" className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200">Rejoindre</Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[120px] -z-10 opacity-60"></div>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Sparkles className="text-blue-600 w-4 h-4" />
             <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Souveraineté Numérique Ivoirienne</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-serif font-bold mb-8 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Le réseau social pour <br/><span className="italic text-blue-600">bâtir la Nation.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Pensez votre quartier, reliez vos forces, et agissez concrètement pour le progrès social de la Côte d'Ivoire.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Link to="/auth" className="bg-blue-600 text-white px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3">
              Commencer mon engagement <ArrowRight size={18} />
            </Link>
            <a href="#features" className="bg-white border border-gray-100 text-gray-900 px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-3">
              Découvrir les outils
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Le Pouvoir d'Agir</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-medium">Trois piliers pour transformer votre territoire en temps réel.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={Camera} 
              title="Sentinelle Verte" 
              desc="Scannez les nuisances urbaines et recevez instantanément un plan d'action certifié par l'IA."
              color="bg-emerald-500"
            />
            <FeatureCard 
              icon={Gavel} 
              title="Référendum RIC" 
              desc="Proposez des changements pour votre communauté et récoltez les signatures de vos concitoyens."
              color="bg-orange-500"
            />
            <FeatureCard 
              icon={Video} 
              title="Studio Griot" 
              desc="Donnez vie à vos projets sociaux avec des clips vidéos inspirants générés par notre IA."
              color="bg-amber-500"
            />
          </div>
        </div>
      </section>

      {/* LOGIN SECTION */}
      <section id="login" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div>
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-10 shadow-xl shadow-blue-100">
                <Shield size={32} />
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight">Accédez à votre <br/><span className="text-blue-600">Espace Souverain.</span></h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed mb-10">
                Votre identité citoyenne est le socle de notre unité. Connectez-vous pour rejoindre l'Agora et contribuer au bien commun.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                   {[1,2,3,4].map(i => <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="w-12 h-12 rounded-full border-4 border-white shadow-sm" />)}
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">+12k Citoyens engagés</p>
              </div>
           </div>

           <div className="bg-white border border-gray-100 rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:rotate-12 transition-transform"><Logo size={200} showText={false} /></div>
              <form onSubmit={handleLogin} className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Identifiant Citoyen</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nom@citoyen.ci" 
                      className="w-full bg-gray-50 border-2 border-transparent py-6 pl-16 pr-6 rounded-[1.5rem] outline-none focus:border-blue-100 focus:bg-white text-gray-900 font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Code de Sagesse</label>
                  <div className="relative group/input">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-gray-50 border-2 border-transparent py-6 pl-16 pr-6 rounded-[1.5rem] outline-none focus:border-blue-100 focus:bg-white text-gray-900 font-bold transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-xl hover:bg-black active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  {loading ? "AUTHENTIFICATION..." : "ENTRER DANS LE CERCLE"}
                </button>
              </form>
              <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                <button onClick={() => navigate('/auth')} className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-600 tracking-widest transition-colors">Pas de compte ? Créer mon identité</button>
              </div>
           </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="bg-gray-950 text-white py-24 px-6 text-center">
         <h2 className="text-4xl font-serif font-bold mb-8">Penser. Relier. Agir.</h2>
         <p className="text-gray-400 mb-12 max-w-xl mx-auto font-medium">Le destin de notre Nation est entre les mains de ses citoyens conscients.</p>
         <Link to="/manifesto" className="text-blue-400 font-black text-[10px] uppercase tracking-[0.4em] hover:text-blue-300 transition-all flex items-center justify-center gap-2">
            Consulter le Manifeste <ArrowRight size={14} />
         </Link>
      </footer>
    </div>
  );
};

export default LandingPage;
