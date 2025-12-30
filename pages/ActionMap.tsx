
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
       <div className={`absolute -inset-4 rounded-full ${colors[type]} opacity-10 animate-ping`}></div>
       <div className={`w-5 h-5 ${colors[type]} rounded-full border-2 border-white shadow-lg transition-all group-hover:scale-150 z-10`}></div>
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30">
          <div className="bg-gray-900 text-white p-4 rounded-2xl text-[10px] font-bold text-center shadow-2xl border border-white/10 backdrop-blur-md">
             <p className="text-blue-400 font-black uppercase text-[8px] mb-1 tracking-widest">{city}</p>
             <p className="leading-tight">{label}</p>
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
      
      {/* HEADER AVEC CARTE MAJESTUEUSE - GRAND FORMAT */}
      <section className="mb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div>
            <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-6 transition-colors text-sm font-bold group">
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au fil citoyen
            </Link>
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Empreinte Territoriale</h1>
            <p className="text-gray-500 text-xl max-w-2xl leading-relaxed italic font-medium">
              "L'action citoyenne dessine le visage de notre nation." <br />
              <span className="text-blue-600 not-italic font-bold">Visualisation souveraine du maillage territorial.</span>
            </p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center min-w-[140px] hover:shadow-lg transition-all">
                <p className="text-3xl font-serif font-bold text-blue-600">312</p>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mt-2">Actions Réelles</p>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center min-w-[140px] hover:shadow-lg transition-all">
                <p className="text-3xl font-serif font-bold text-emerald-600">42</p>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mt-2">Lieux Souverains</p>
             </div>
          </div>
        </div>

        <div className="relative w-full bg-white border border-gray-100 rounded-[5rem] shadow-prestige overflow-hidden h-[600px] md:h-[750px] group">
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            {/* SVG CARTE IVOIRE GRAND FORMAT AVEC PLUS DE DÉTAIL */}
            <svg className="w-full h-full p-20 opacity-[0.15] transition-all group-hover:scale-105 duration-[2000ms]" viewBox="0 0 800 600" fill="none">
              <path d="M350 50 Q 420 20, 500 60 T 650 100 Q 750 150, 700 250 T 600 400 Q 550 550, 400 500 T 250 450 Q 150 400, 200 250 T 300 150 T 350 50" stroke="currentColor" strokeWidth="4" className="text-blue-900" />
              <path d="M400 0V600M0 300H800" stroke="currentColor" strokeWidth="1" strokeDasharray="15 15" className="text-gray-300" />
            </svg>

            {/* Points d'impact territoriaux majeurs - Démo de la Nation */}
            <MapPoint x="55%" y="78%" city="Abidjan" type="solidarity" label="Pôle de Solidarité Lagunaire (Yopougon)" />
            <MapPoint x="48%" y="45%" city="Yamoussoukro" type="action" label="Sentier de l'Agriculture Souveraine" />
            <MapPoint x="42%" y="30%" city="Bouaké" type="palabre" label="Grand Palabre de Cohésion Sociale" />
            <MapPoint x="22%" y="82%" city="San Pedro" type="solidarity" label="Marché Citoyen Portuaire" />
            <MapPoint x="30%" y="40%" city="Man" type="action" label="Action Environnement Mont Tonkpi" />
            <MapPoint x="65%" y="35%" city="Bondoukou" type="palabre" label="Médiation Culturelle et Patrimoine" />
            <MapPoint x="45%" y="15%" city="Korhogo" type="action" label="Innovation Tech Solaire Nord" />
          </div>

          <div className="absolute top-10 left-10 flex flex-col gap-4 z-30">
             <div className="flex items-center gap-4 bg-white/95 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white shadow-2xl">
                <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-700">Sentiers Actifs</span>
             </div>
             <div className="flex items-center gap-4 bg-white/95 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white shadow-2xl">
                <div className="w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]"></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-700">Palabres de Zone</span>
             </div>
             <div className="flex items-center gap-4 bg-white/95 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white shadow-2xl">
                <div className="w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]"></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-700">Soutien Solidaire</span>
             </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent p-16 text-center">
             <div className="inline-flex items-center gap-4 px-10 py-6 bg-gray-900/90 backdrop-blur-2xl text-white rounded-full border border-white/20 shadow-3xl">
                <Sparkles className="w-6 h-6 text-blue-400" />
                <span className="text-base font-bold italic tracking-wide">Tableau de bord actualisé en temps réel par les citoyens du Cercle</span>
             </div>
          </div>
        </div>
      </section>

      {/* BARRE DE RECHERCHE DE PROXIMITÉ - INTÉGRATION FLUIDE */}
      <section className="max-w-4xl mx-auto mb-32">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-100">
            <Search size={32} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Localisez votre action citoyenne</h2>
          <p className="text-gray-500 text-lg italic font-medium">Interrogez l'intelligence territoriale pour trouver vos points d'appui locaux.</p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute left-8 top-1/2 -translate-y-1/2 text-blue-600">
            <Globe className="w-8 h-8" />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: 'ONG de reboisement à Man', 'Mairie de Yopougon'..."
            className="w-full bg-white border border-gray-100 py-10 pl-20 pr-52 rounded-[3rem] shadow-2xl shadow-blue-100/30 outline-none focus:ring-[12px] focus:ring-blue-50 transition-all text-2xl font-medium placeholder:text-gray-300"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-6 top-6 bottom-6 bg-gray-900 text-white px-14 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center gap-4 shadow-xl active:scale-95"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <MapIcon className="w-6 h-6 text-blue-400" />}
            Explorer le Maillage
          </button>
        </form>
        {coords && (
          <div className="flex justify-center mt-10">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-emerald-700 font-black uppercase tracking-[0.3em]">Maillage de proximité activé</span>
            </div>
          </div>
        )}
      </section>

      {/* RÉSULTATS D'ANALYSE */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="lg:col-span-1 space-y-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-400 px-8">Empreintes Identifiées</h3>
            <div className="space-y-6">
              {results.places.length > 0 ? results.places.map((chunk: any, i: number) => chunk.maps && (
                <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:rotate-12 group-hover:scale-110 transition-transform">
                    <MapPin className="w-20 h-20 text-blue-600" />
                  </div>
                  <h4 className="font-serif font-bold text-gray-900 text-2xl mb-8 leading-tight pr-12">{chunk.maps.title}</h4>
                  <a 
                    href={chunk.maps.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-8 py-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    Ouvrir l'Emplacement <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )) : (
                <div className="p-20 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 text-gray-400">
                  <Flag className="w-16 h-16 mx-auto mb-6 opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest">Territoire inexploré</p>
                  <p className="text-xs mt-2 italic">Aucun lieu exact ne correspond à votre requête.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-14 md:p-20 rounded-[5rem] border border-gray-100 shadow-prestige relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-[0.05] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                <Landmark className="w-64 h-64 text-blue-900" />
              </div>
              <div className="flex items-center gap-8 mb-16">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-3xl shadow-blue-100">
                  <Sparkles size={40} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-4xl text-gray-900">Analyse de Maillage</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 mt-2">Synthèse de Souveraineté IA</p>
                </div>
              </div>
              <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed text-2xl whitespace-pre-wrap font-medium italic">
                "{results.text}"
              </div>
              <div className="mt-20 pt-12 border-t border-gray-100 flex flex-wrap gap-12">
                 <div className="flex items-center gap-4 group">
                   <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                     <Users size={24} />
                   </div>
                   <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Mobilisation Locale</span>
                 </div>
                 <div className="flex items-center gap-4 group">
                   <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                     <Building2 size={24} />
                   </div>
                   <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Appui Public</span>
                 </div>
                 <div className="flex items-center gap-4 group">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                     <ShieldCheck size={24} />
                   </div>
                   <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Vérifié Cercle</span>
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
