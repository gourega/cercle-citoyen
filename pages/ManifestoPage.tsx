import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Quote, Target, Eye, CheckCircle2, ArrowRight } from 'lucide-react';

const ManifestoPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Force le scroll en haut de page à l'ouverture
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleAcceptMission = () => {
    sessionStorage.setItem('manifesto_read', 'true');
    navigate('/auth');
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header / Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-50 px-4 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center text-gray-400 hover:text-gray-900 transition-colors font-bold text-sm group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour
          </Link>
          <span className="text-[11px] font-bold text-blue-600 text-right max-w-[280px] sm:max-w-none leading-tight">
            Tu es invité à prendre connaissance du manifeste avant de rejoindre le Cercle.
          </span>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <header className="text-center mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 mb-8 leading-tight">
            Manifeste <br />fondateur
          </h1>
          <p className="text-xl md:text-2xl font-serif italic text-blue-600 mb-12">
            Un espace pour penser, relier et agir
          </p>
          <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
        </header>

        {/* Intro Section */}
        <section className="space-y-8 text-lg md:text-xl text-gray-700 leading-relaxed mb-24">
          <div className="relative">
            <Quote className="absolute -left-8 -top-8 w-16 h-16 text-gray-50 -z-10" />
            <p className="first-letter:text-7xl first-letter:font-serif first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-gray-900">
              Nous vivons une époque bruyante. Une époque où l’opinion précède souvent la réflexion, où l’indignation remplace l’analyse, et où l’engagement se confond trop facilement avec la mise en scène.
            </p>
          </div>
          <p>
            Ce réseau est né d’un refus : le refus de l’indifférence, mais aussi le refus de la superficialité.
          </p>
          <p className="font-bold text-gray-900">
            Il est né d’une conviction simple et exigeante : une société progresse lorsque ses citoyens pensent, dialoguent et agissent ensemble, avec lucidité et responsabilité.
          </p>
        </section>

        {/* Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Pourquoi ce réseau existe</h2>
            <ul className="space-y-4 text-sm font-medium text-gray-600">
              <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Refuser de se contenter de commenter le monde</li>
              <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Construire le civisme au quotidien</li>
              <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Croire au changement par la conscience</li>
              <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> L'engagement comme un devoir sincère</li>
            </ul>
          </div>

          <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-6">Notre vision</h2>
            <p className="text-sm opacity-90 leading-relaxed mb-6">Nous croyons en une citoyenneté :</p>
            <ul className="space-y-4 text-sm font-bold">
              <li>• Éclairée (compréhension vs rumeur)</li>
              <li>• Active (actes concrets)</li>
              <li>• Inclusive (diversité des parcours)</li>
              <li>• Responsable (impact des choix)</li>
            </ul>
          </div>
        </div>

        {/* Final Section with Scroll Reveal */}
        <section 
          ref={sectionRef}
          className={`bg-gray-900 text-white p-12 md:p-20 rounded-[4rem] text-center shadow-2xl relative overflow-hidden transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
          
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8">À celles et ceux qui nous rejoignent</h2>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Entrer dans ce réseau, ce n’est pas chercher une tribune. C’est accepter une responsabilité. Celle de penser avant de parler. Celle d’écouter avant de juger. Celle d’agir, même modestement, mais sincèrement.
          </p>
          
          <div className="space-y-4 mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Notre signature</p>
            <p className="text-5xl md:text-6xl font-serif font-bold tracking-tighter">Penser. Relier. Agir.</p>
          </div>

          <button 
            onClick={handleAcceptMission}
            className="inline-flex bg-white text-gray-900 px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl group"
          >
            Accepter la mission <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>
      </article>
    </div>
  );
};

export default ManifestoPage;