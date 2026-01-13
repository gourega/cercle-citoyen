import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Quote, Target, Eye, CheckCircle2, ArrowRight } from 'lucide-react';

const ManifestoPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleAcceptMission = () => {
    sessionStorage.setItem('manifesto_read', 'true');
    navigate('/auth');
  };

  return (
    <div className="bg-[#0a0c10] min-h-screen text-slate-300 selection:bg-blue-500">
      <nav className="sticky top-0 z-50 bg-[#0a0c10]/80 backdrop-blur-md border-b border-white/5 px-6 py-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center text-slate-500 hover:text-white transition-colors font-bold text-sm group uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Retour
          </Link>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-right">
            LECTURE OBLIGATOIRE DU MANIFESTE
          </span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-24 md:py-32">
        <header className="text-center mb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-10 leading-tight tracking-tighter">
            Manifeste <br />Fondateur
          </h1>
          <p className="text-2xl md:text-3xl font-serif italic text-blue-500 mb-12">
            "Penser. Relier. Agir."
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </header>

        <section className="space-y-12 text-xl md:text-2xl text-slate-300 leading-[1.8] mb-32">
          <div className="relative">
            <Quote className="absolute -left-12 -top-12 w-24 h-24 text-white/5 -z-10" />
            <p className="first-letter:text-8xl first-letter:font-serif first-letter:font-bold first-letter:mr-4 first-letter:float-left first-letter:text-white">
              Nous vivons une époque bruyante. Une époque où l’opinion précède souvent la réflexion, où l’indignation remplace l’analyse, et où l’engagement se confond trop facilement avec la mise en scène.
            </p>
          </div>
          <p>
            Ce réseau est né d’un refus : le refus de l’indifférence, mais aussi le refus de la superficialité qui gangrène nos échanges numériques.
          </p>
          <p className="font-bold text-white bg-blue-600/10 p-10 rounded-[2.5rem] border border-blue-500/20 shadow-inner">
            Il est né d’une conviction simple et exigeante : une société progresse réellement lorsque ses citoyens pensent, dialoguent et agissent ensemble, avec lucidité et responsabilité.
          </p>
          <p>
            Ici, nous ne cherchons pas le clic facile ou l'approbation éphémère. Nous cherchons l'impact durable sur notre territoire.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-32">
          <div className="bg-slate-900 p-12 rounded-[3rem] border border-white/5 shadow-2xl">
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20">
              <Target className="w-7 h-7 text-blue-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-8">La Mission</h2>
            <ul className="space-y-6 text-base font-medium text-slate-400">
              <li className="flex gap-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Comprendre avant de commenter</li>
              <li className="flex gap-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Construire le civisme local</li>
              <li className="flex gap-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Agir avec conscience et éthique</li>
              <li className="flex gap-4"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Protéger notre souveraineté</li>
            </ul>
          </div>

          <div className="bg-blue-600 p-12 rounded-[3rem] text-white shadow-2xl shadow-blue-900/40">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
              <Eye className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-8">L'Engagement</h2>
            <p className="text-lg opacity-90 leading-relaxed mb-8">Nous bâtissons ensemble une citoyenneté :</p>
            <ul className="space-y-6 text-base font-black uppercase tracking-widest">
              <li>• ÉCLAIRÉE</li>
              <li>• ACTIVE</li>
              <li>• INCLUSIVE</li>
              <li>• RESPONSABLE</li>
            </ul>
          </div>
        </div>

        <section 
          ref={sectionRef}
          className={`bg-white text-gray-900 p-16 md:p-24 rounded-[4rem] text-center shadow-prestige relative overflow-hidden transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
          
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-10 leading-tight">Prêt pour le changement ?</h2>
          <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto leading-relaxed">
            Entrer dans ce réseau, c’est accepter une responsabilité envers soi-même et envers la Cité. Celle de cultiver sa propre sagesse au service de tous.
          </p>
          
          <button 
            onClick={handleAcceptMission}
            className="inline-flex bg-blue-600 text-white px-16 py-7 rounded-full font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl group items-center gap-4"
          >
            Signer le Manifeste <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </section>
      </article>
    </div>
  );
};

export default ManifestoPage;