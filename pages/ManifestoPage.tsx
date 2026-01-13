import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Quote, Target, Eye, CheckCircle2, ArrowRight } from 'lucide-react';

const ManifestoPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 selection:bg-blue-500 selection:text-white pb-32">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center text-slate-500 hover:text-white transition-colors font-black text-[10px] uppercase tracking-[0.3em]">
            <ChevronLeft className="w-4 h-4 mr-2" /> Retour
          </Link>
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Manifeste Souverain</span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-24 md:py-32">
        <header className="text-center mb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-10 leading-[1.1] tracking-tighter">
            Manifeste <br />Fondateur
          </h1>
          <p className="text-2xl md:text-4xl font-serif italic text-blue-500 mb-12">
            "Penser. Relier. Agir."
          </p>
          <div className="w-32 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </header>

        <section className="space-y-12 text-xl md:text-2xl text-slate-300 leading-[1.8] mb-32">
          <div className="relative">
            <Quote className="absolute -left-12 -top-12 w-24 h-24 text-white/5 -z-10" />
            <p className="first-letter:text-8xl first-letter:font-serif first-letter:font-bold first-letter:mr-6 first-letter:float-left first-letter:text-white first-letter:leading-none">
              Nous vivons une époque bruyante. Une époque où l’opinion précède souvent la réflexion, où l’indignation remplace l’analyse, et où l’engagement se confond trop facilement avec la mise en scène.
            </p>
          </div>
          <p>
            Ce réseau est né d’un refus : le refus de l’indifférence, mais aussi le refus de la superficialité qui gangrène nos échanges numériques.
          </p>
          <div className="bg-blue-600/5 p-12 rounded-[3rem] border border-blue-500/20 shadow-inner">
            <p className="font-serif italic text-2xl md:text-3xl text-white leading-relaxed">
              "Une société progresse réellement lorsque ses citoyens pensent, dialoguent et agissent ensemble, avec lucidité et responsabilité."
            </p>
          </div>
          <p>
            Ici, nous ne cherchons pas le clic facile ou l'approbation éphémère. Nous cherchons l'impact durable sur notre territoire, en Côte d'Ivoire.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-40">
          <div className="bg-slate-900 p-12 rounded-[3rem] border border-white/5">
            <Target className="w-10 h-10 text-blue-500 mb-8" />
            <h2 className="text-3xl font-serif font-bold text-white mb-8 leading-tight">La Mission</h2>
            <ul className="space-y-6 text-base font-medium text-slate-400">
              <li className="flex gap-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Comprendre avant de commenter</li>
              <li className="flex gap-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Construire le civisme local</li>
              <li className="flex gap-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Agir avec conscience et éthique</li>
            </ul>
          </div>
          <div className="bg-blue-600 p-12 rounded-[3rem] text-white">
            <Eye className="w-10 h-10 text-white mb-8" />
            <h2 className="text-3xl font-serif font-bold mb-8 leading-tight">L'Engagement</h2>
            <ul className="space-y-6 text-[10px] font-black uppercase tracking-[0.3em]">
              <li>• ÉCLAIRÉE</li>
              <li>• ACTIVE</li>
              <li>• INCLUSIVE</li>
              <li>• RESPONSABLE</li>
            </ul>
          </div>
        </div>

        <section 
          ref={sectionRef}
          className={`bg-white text-slate-950 p-16 md:p-24 rounded-[4rem] text-center shadow-prestige transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-10 leading-tight">Prêt pour le changement ?</h2>
          <p className="text-xl text-slate-600 mb-16 max-w-xl mx-auto leading-relaxed">
            Entrer dans ce réseau, c’est accepter une responsabilité envers soi-même et envers la Cité.
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="w-full bg-blue-600 text-white py-8 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-950 transition-all shadow-2xl flex items-center justify-center gap-4"
          >
            Signer le Manifeste <ArrowRight className="w-6 h-6" />
          </button>
        </section>
      </article>
    </div>
  );
};

export default ManifestoPage;