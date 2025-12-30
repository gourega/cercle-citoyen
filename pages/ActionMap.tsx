
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Loader2, Navigation, ExternalLink, Info, 
  Globe, Sparkles, Map as MapIcon, ShieldCheck, Flag, Zap, 
  Users, Building2, Landmark, ChevronLeft
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
       <div className={`absolute -inset-4 rounded-full ${colors[type]} opacity-10 animate-ping`}></div>
       <div className={`w-4 h-4 ${colors[type]} rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-150`}></div>
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-40 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30">
          <div className="bg-gray-900 text-white p-3 rounded-xl text-[10px] font-bold text-center shadow-2xl border border-white/10">
             <p className="text-blue-400 font-black uppercase text-[8px] mb-1">{city}</p>
             {label}
             <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
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
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 animate-in fade-in duration-700">
      
      {/* HEADER AVEC CARTE MAJESTUEUSE */}
      <section className="mb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div>
            <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-6 transition-colors text-sm font-bold group">
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au fil
            </Link>
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Empreinte Territoriale</h1>
            <p className="text-gray-500 text-lg max-w-2xl leading-relaxed italic">
              "L'action citoyenne dessine le visage de notre avenir." Visualisez le maillage de la souveraineté sur tout le territoire.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                <p className="text-2xl font-serif font-bold text-blue-600">312</p>
                <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mt-1">Actions Réelles</p>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                <p className="text-2xl font-serif font-bold text-emerald-600">42</p>
                <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mt-1">Lieux Souverains</p>
             </div>
          </div>
        </div>

        <div className="relative w-full bg-white border border-gray-100 rounded-[4rem] shadow-prestige overflow-hidden h-[500px] md:h-[650px] group">
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            {/* SVG CARTE IVOIRE GRAND FORMAT */}
            <svg className="w-full h-full p-20 opacity-20 transition-all group-hover:scale-105 duration-1000" viewBox="0 0 800 600" fill="none">
              <path d="M350 50 Q 420 20, 500 60 T 650 100 Q 750 150, 700 250 T 600 400 Q 550 550, 400 500 T 250 450 Q 150 400, 200 250 T 300 150 T 350 50" stroke="currentColor" strokeWidth="3" className="text-blue-900" />
              <path d="M400 0V600M0 300H800" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" className="text-gray-200" />
            </svg>

            {/* Points d'impact territoriaux majeurs */}
            <MapPoint x="55%" y="78%" city="Abidjan" type="solidarity" label="Pôle de Solidarité Lagunaire" />
            <MapPoint x="48%" y="45%" city="Yamoussoukro" type="action" label="Sentier de l'Agriculture" />
            <MapPoint x="42%" y="30%" city="Bouaké" type="palabre" label="Grand Palabre Régional" />
            <MapPoint x="22%" y="82%" city="San Pedro" type="solidarity" label="Marché Citoyen Portuaire" />
            <MapPoint x="30%" y="40%" city="Man" type="action" label="Action Environnement Montagne" />
            <MapPoint x="65%" y="35%" city="Bondoukou" type="palabre" label="Médiation Culturelle" />
            <MapPoint x="45%" y="15%" city="Korhogo" type="action" label="Innovation Tech Solaire" />
          </div>

          <div className="absolute top-8 left-8 flex flex-col gap-3 z-30">
             <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-xl">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Sentiers Actifs</span>
             </div>
             <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-xl">
                <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Palabres de Zone</span>
             </div>
             <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-xl">
                <div className="w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Soutien Solidaire</span>
             </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900/40 to-transparent p-12 text-center pointer-events-none">
             <div className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900/80 backdrop-blur-xl text-white rounded-full border border-white/10 shadow-2xl">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold italic">Radar souverain actualisé en temps réel par les citoyens</span>
             </div>
          </div>
        </div>
      </section>

      {/* BARRE DE RECHERCHE DE PROXIMITÉ */}
      <section className="max-w-4xl mx-auto mb-20">
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search size={28} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Localisez votre action</h2>
          <p className="text-gray-400 text-sm italic font-medium">Interrogez l'intelligence territoriale pour trouver vos points d'appui.</p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600">
            <Globe className="w-7 h-7" />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: 'Mairies à Yamoussoukro', 'ONG Santé à Bouaké'..."
            className="w-full bg-white border border-gray-100 py-8 pl-16 pr-44 rounded-[2.5rem] shadow-2xl shadow-blue-100/20 outline-none focus:ring-8 focus:ring-blue-50 transition-all text-xl font-medium"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-4 top-4 bottom-4 bg-gray-900 text-white px-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapIcon className="w-5 h-5 text-blue-400" />}
            Explorer
          </button>
        </form>
        {coords && (
          <p className="text-center mt-6 text-[10px] text-emerald-600 font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Maillage de proximité activé
          </p>
        )}
      </section>

      {/* RÉSULTATS D'ANALYSE */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-1 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-6">Empreintes Identifiées</h3>
            <div className="space-y-4">
              {results.places.length > 0 ? results.places.map((chunk: any, i: number) => chunk.maps && (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform">
                    <MapPin className="w-16 h-16 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-6 leading-tight pr-10">{chunk.maps.title}</h4>
                  <a 
                    href={chunk.maps.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    Ouvrir l'Emplacement <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )) : (
                <div className="p-16 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 text-gray-400">
                  <Flag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">Territoire inexploré</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-12 md:p-16 rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Landmark className="w-48 h-48 text-blue-900" />
              </div>
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-100">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-3xl text-gray-900">Analyse de Maillage</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mt-1">Synthèse Territoriale IA</p>
                </div>
              </div>
              <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed text-xl whitespace-pre-wrap font-medium italic">
                "{results.text}"
              </div>
              <div className="mt-16 pt-10 border-t border-gray-50 flex flex-wrap gap-8">
                 <div className="flex items-center gap-3">
                   <Users className="text-gray-400" size={20} />
                   <span className="text-xs font-bold text-gray-500">Mobilisation Locale</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Building2 className="text-gray-400" size={20} />
                   <span className="text-xs font-bold text-gray-500">Points d'Appui Publics</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <ShieldCheck className="text-emerald-500" size={20} />
                   <span className="text-xs font-bold text-emerald-600">Vérifié par le Cercle</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMap;
