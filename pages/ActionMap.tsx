import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Loader2, Navigation, ExternalLink, Info, 
  Globe, Sparkles, Map as MapIcon, ShieldCheck, Flag, Zap, 
  Users, Building2, Landmark, ChevronLeft, ArrowRight
} from 'lucide-react';
import { findInitiatives } from '../lib/gemini';
import { Link } from 'react-router-dom';

const MapPoint = ({ x, y, type, label, city }: { x: string, y: string, type: 'action' | 'palabre' | 'solidarity', label: string, city: string }) => {
  const colors = {
    action: 'bg-emerald-500',
    palabre: 'bg-amber-500',
    solidarity: 'bg-rose-500'
  };
  
  return (
    <div className="absolute group cursor-pointer" style={{ left: x, top: y }}>
       {/* Taille réduite sur mobile (w-3) vs bureau (w-5) */}
       <div className={`absolute -inset-2 md:-inset-4 rounded-full ${colors[type]} opacity-10 animate-ping`}></div>
       <div className={`w-3 h-3 md:w-5 md:h-5 ${colors[type]} rounded-full border border-white md:border-2 shadow-lg transition-all group-hover:scale-150 z-10`}></div>
       
       {/* Tooltip plus compact */}
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 md:mb-4 w-32 md:w-48 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30">
          <div className="bg-gray-900 text-white p-2 md:p-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-bold text-center shadow-2xl border border-white/10 backdrop-blur-md">
             <p className="text-blue-400 font-black uppercase text-[7px] md:text-[8px] mb-0.5 md:mb-1 tracking-widest">{city}</p>
             <p className="leading-tight">{label}</p>
             <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 md:border-8 border-transparent border-t-gray-900"></div>
          </div>
       </div>
    </div>
  );
};

const ActionMap: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{text: string, places: any[]} | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("Location access denied")
    );
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await findInitiatives(query, coords?.lat, coords?.lng);
      setResults(res);
    } catch (e) {
      console.error(e);
      setResults({
          text: "La recherche rencontre une difficulté temporaire.",
          places: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-12 animate-in fade-in duration-700">
      
      <section className="mb-10 md:mb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-8 md:mb-12">
          <div>
            <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-4 transition-colors text-xs font-bold group">
              <ChevronLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Empreinte Territoriale</h1>
            <p className="text-gray-500 text-base md:text-xl max-w-2xl leading-relaxed italic font-medium">
              "L'action citoyenne dessine le visage de notre nation."
            </p>
          </div>
          <div className="flex gap-2 md:gap-4 w-full md:w-auto">
             <div className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm text-center flex-1 md:min-w-[140px]">
                <p className="text-xl md:text-3xl font-serif font-bold text-blue-600">312</p>
                <p className="text-[7px] md:text-[9px] font-black uppercase text-gray-400 tracking-widest mt-1">Actions</p>
             </div>
             <div className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm text-center flex-1 md:min-w-[140px]">
                <p className="text-xl md:text-3xl font-serif font-bold text-emerald-600">42</p>
                <p className="text-[7px] md:text-[9px] font-black uppercase text-gray-400 tracking-widest mt-1">Lieux</p>
             </div>
          </div>
        </div>

        <div className="relative w-full bg-white border border-gray-100 rounded-[2.5rem] md:rounded-[5rem] shadow-xl overflow-hidden h-[400px] md:h-[750px] group">
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <svg className="w-full h-full p-10 md:p-20 opacity-[0.1] md:opacity-[0.15] transition-all group-hover:scale-105 duration-[2000ms]" viewBox="0 0 800 600" fill="none">
              <path d="M350 50 Q 420 20, 500 60 T 650 100 Q 750 150, 700 250 T 600 400 Q 550 550, 400 500 T 250 450 Q 150 400, 200 250 T 300 150 T 350 50" stroke="currentColor" strokeWidth="4" className="text-blue-900" />
            </svg>

            <MapPoint x="55%" y="78%" city="Abidjan" type="solidarity" label="Solidarité Lagunaire" />
            <MapPoint x="48%" y="45%" city="Yamoussoukro" type="action" label="Agriculture Souveraine" />
            <MapPoint x="42%" y="30%" city="Bouaké" type="palabre" label="Grand Palabre" />
            <MapPoint x="22%" y="82%" city="San Pedro" type="solidarity" label="Marché Citoyen" />
            <MapPoint x="30%" y="40%" city="Man" type="action" label="Action Environnement" />
            <MapPoint x="65%" y="35%" city="Bondoukou" type="palabre" label="Médiation Culturelle" />
            <MapPoint x="45%" y="15%" city="Korhogo" type="action" label="Innovation Tech" />
          </div>

          {/* Légende optimisée pour Mobile (horizontale en haut) vs Desktop (verticale en haut gauche) */}
          <div className="absolute top-4 md:top-10 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0 flex flex-row md:flex-col gap-2 md:gap-4 z-30 w-[90%] md:w-auto justify-center md:justify-start">
             <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 md:px-8 py-2 md:py-4 rounded-full md:rounded-3xl border border-white shadow-xl flex-1 md:flex-none">
                <div className="w-2 md:w-4 h-2 md:h-4 bg-emerald-500 rounded-full"></div>
                <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-gray-700 whitespace-nowrap">Sentiers</span>
             </div>
             <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 md:px-8 py-2 md:py-4 rounded-full md:rounded-3xl border border-white shadow-xl flex-1 md:flex-none">
                <div className="w-2 md:w-4 h-2 md:h-4 bg-amber-500 rounded-full"></div>
                <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-gray-700 whitespace-nowrap">Palabres</span>
             </div>
             <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 md:px-8 py-2 md:py-4 rounded-full md:rounded-3xl border border-white shadow-xl flex-1 md:flex-none">
                <div className="w-2 md:w-4 h-2 md:h-4 bg-rose-500 rounded-full"></div>
                <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-gray-700 whitespace-nowrap">Soutien</span>
             </div>
          </div>

          {/* Masqué sur mobile pour éviter de surcharger la vue */}
          <div className="hidden md:block absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent p-16 text-center">
             <div className="inline-flex items-center gap-4 px-10 py-6 bg-gray-900/90 backdrop-blur-2xl text-white rounded-full border border-white/20 shadow-3xl">
                <Sparkles className="w-6 h-6 text-blue-400" />
                <span className="text-base font-bold italic tracking-wide">Tableau de bord citoyen actualisé</span>
             </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto mb-20 md:mb-32">
        <div className="text-center mb-8 md:mb-16">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 text-white rounded-xl md:rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 md:mb-8 shadow-2xl">
            <Search size={24} className="md:w-8 md:h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2 md:mb-4">Localisation de Proximité</h2>
          <p className="text-gray-500 text-sm md:text-lg italic font-medium px-4">Trouvez vos points d'appui locaux.</p>
        </div>

        <form onSubmit={handleSearch} className="relative group px-4 md:px-0">
          <div className="absolute left-10 md:left-8 top-1/2 -translate-y-1/2 text-blue-600 hidden md:block">
            <Globe className="w-8 h-8" />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: 'Santé à Abobo'..."
            className="w-full bg-white border border-gray-100 py-6 md:py-10 pl-6 md:pl-20 pr-6 md:pr-52 rounded-[2rem] md:rounded-[3rem] shadow-xl outline-none focus:ring-8 focus:ring-blue-50 transition-all text-lg md:text-2xl font-medium placeholder:text-gray-300"
          />
          <button 
            type="submit"
            disabled={loading}
            className="mt-4 md:mt-0 md:absolute md:right-6 md:top-6 md:bottom-6 bg-gray-900 text-white w-full md:w-auto px-10 md:px-14 py-4 md:py-0 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapIcon className="w-5 h-5 text-blue-400" />}
            Explorer
          </button>
        </form>
      </section>

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-16 items-start animate-in fade-in slide-in-from-bottom-8 duration-600">
          <div className="lg:col-span-1 space-y-6 md:space-y-10">
            <h3 className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-gray-400 px-6">Empreintes Identifiées</h3>
            <div className="space-y-4 md:space-y-6">
              {results.places.length > 0 ? results.places.map((chunk: any, i: number) => chunk.maps && (
                <div key={i} className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <h4 className="font-serif font-bold text-gray-900 text-xl md:text-2xl mb-6 md:mb-8 leading-tight">{chunk.maps.title}</h4>
                  <a 
                    href={chunk.maps.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all"
                  >
                    Itinéraire <ExternalLink size={14} />
                  </a>
                </div>
              )) : (
                <div className="p-10 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-400">
                  <p className="text-xs font-black uppercase tracking-widest">Zone calme</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-6 mb-10 md:mb-12">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Analyse de Maillage</h3>
                </div>
              </div>
              <div className="text-gray-700 leading-relaxed text-lg md:text-xl whitespace-pre-wrap font-medium italic">
                "{results.text}"
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMap;