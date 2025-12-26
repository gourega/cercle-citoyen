
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Fix: Alias User as UserIcon from lucide-react to match usage in the component
import { User as UserIcon, LayoutGrid, Sparkles, ArrowRight, Heart, Quote, ShieldCheck, CheckCircle, Award } from 'lucide-react';
import Logo from '../Logo';

const WelcomePage: React.FC = () => {
  const [showSeal, setShowSeal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSeal(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6 py-12 lg:py-24">
      <div className="max-w-3xl w-full">
        {/* Header Decor */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-center mb-10">
            {/* Logo cliquable */}
            <Link to="/" className="hover:opacity-80 transition-all transform active:scale-95">
              <Logo size={80} variant="amber" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
            Bienvenue dans le <br /><span className="text-blue-600 italic">Cercle Citoyen</span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.4em]">
            <span className="h-px w-8 bg-gray-200"></span>
            Votre voix compte • Votre engagement est notre force
            <span className="h-px w-8 bg-gray-200"></span>
          </div>
        </div>

        {/* The Letter */}
        <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <Quote className="absolute top-10 right-10 w-20 h-20 text-blue-50/50 -z-0" />
          
          {/* Validation Seal Overlay */}
          <div className={`absolute top-10 left-10 transition-all duration-700 transform ${showSeal ? 'opacity-100 scale-100 rotate-12' : 'opacity-0 scale-150 rotate-0'}`}>
            <div className="w-24 h-24 border-4 border-emerald-500/30 rounded-full flex flex-col items-center justify-center text-emerald-600 bg-emerald-50/50 backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 mb-1" />
              <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-none">Citoyen<br/>Validé</span>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-xl font-serif font-bold text-blue-600 flex items-center gap-3">
                <span className="w-8 h-px bg-blue-200"></span>
                Message du Fondateur
              </h2>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Certificat N°</p>
                <p className="text-xs font-mono font-bold text-gray-400 italic">CC-2024-0042-AK</p>
              </div>
            </div>
            
            <div className="prose prose-lg prose-blue text-gray-700 font-medium leading-relaxed space-y-6">
              <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-gray-900 first-letter:mr-3 first-letter:float-left">
                C’est avec une immense joie que je vous accueille au sein du Cercle Citoyen. Votre décision de nous rejoindre est le premier pas vers une participation active et constructive à la vie de notre communauté.
              </p>
              
              <p>
                Ici, chaque idée est une graine, chaque débat une occasion de grandir et chaque action un pas vers l'avenir que nous voulons construire ensemble.
              </p>
              
              <p className="bg-blue-50/30 p-6 rounded-2xl italic border-l-4 border-blue-600 text-gray-600">
                "Ce cercle est le vôtre. Explorez, partagez, et n'hésitez jamais à prendre l'initiative. Ensemble, nous sommes plus qu'une somme d'individus, nous sommes une force de changement."
              </p>
            </div>

            {/* Signature Area */}
            <div className="mt-12 pt-12 border-t border-gray-50 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <p className="text-2xl font-serif font-bold text-gray-900 mb-1">Kouassi Ouréga Goble</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-1">Fondateur de Cercle Citoyen</p>
                <p className="text-xs text-gray-400 font-medium">Citoyen bénévole engagé • Spécialiste en Organisations communautaires</p>
              </div>
              <div className="w-32 h-16 opacity-30 border-b-2 border-gray-100 flex items-center justify-center font-serif italic text-gray-400">
                Signature
              </div>
            </div>
          </div>
        </div>

        {/* Action Blocks */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <Link 
            to="/feed" 
            className="group p-8 bg-gray-900 text-white rounded-[2.5rem] hover:bg-black transition-all flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-12 h-12" />
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Explorer le Fil</h3>
            <p className="text-xs text-gray-400 max-w-[180px]">Découvrez les débats et les initiatives en cours.</p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              Y aller <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          <Link 
            to="/profile" 
            className="group p-8 bg-white border border-gray-100 rounded-[2.5rem] hover:border-blue-200 transition-all flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-blue-600">
              <UserIcon className="w-12 h-12" />
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <UserIcon className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Mon Profil</h3>
            <p className="text-xs text-gray-500 max-w-[180px]">Complétez votre identité pour mieux rayonner.</p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              Compléter <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>

        {/* Footer DNA - Unification Nom -> Accueil */}
        <div className="mt-20 pt-8 border-t border-gray-100 flex flex-col items-center gap-4 text-gray-400 italic font-serif">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-blue-600" />
            <span>"Penser. Relier. Agir."</span>
          </div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] not-italic text-gray-300">
            <Link to="/legal" className="hover:text-blue-600 transition-colors">Mentions Légales</Link>
            <span>© 2024 CERCLE CITOYEN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
