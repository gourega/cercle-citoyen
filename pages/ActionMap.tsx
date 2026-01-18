
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Loader2, Navigation, ExternalLink, Info, 
  Globe, Sparkles, Map as MapIcon, ShieldCheck, Flag, Zap, 
  Users, Building2, Landmark, ChevronLeft, ArrowRight, Trash2,
  RefreshCw, List, Locate, MessageCircle, Handshake, Target
} from 'lucide-react';
import { findInitiatives } from '../lib/gemini';
import { Link } from 'react-router-dom';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { WasteReport } from '../types.ts';

type MapCategory = 'sentiers' | 'palabre' | 'soutien';

const convertCoordsToPercent = (lat: number, lng: number) => {
  const latMin = 4.0, latMax = 11.0;
  const lngMin = -9.0, lngMax = -2.0;
  const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
  return { 
    x: Math.max(5, Math.min(95, x)) + "%", 
    y: Math.max(5, Math.min(95, y)) + "%" 
  };
};

const MapPoint = ({ x, y, label, city, category }: any) => {
  const colors = {
    sentiers: 'bg-blue-600',
    palabre: 'bg-amber-500',
    soutien: 'bg-emerald-500'
  };
  const activeColor = colors[category as MapCategory] || 'bg-gray-600';

  return (
    <div className="absolute group cursor-pointer" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
       <div className={`absolute -inset-6 rounded-full ${activeColor} opacity-20 animate-pulse`}></div>
       <div className={`w-5 h-5 ${activeColor} rounded-full border-[3px] border-white shadow-2xl transition-all group-hover:scale-150 z-10`}></div>
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30">
          <div className="bg-gray-950 text-white p-4 rounded-2xl text-[10px] font-bold text-center shadow-3xl border border-white/10 backdrop-blur-xl">
             <p className="font-black uppercase text-[8px] mb-1 tracking-widest opacity-60">{city || 'Position scellée'}</p>
             <p className="leading-tight">{label}</p>
             <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-950"></div>
          </div>
       </div>
    </div>
  );
};

const ActionMap: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MapCategory>('sentiers');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [results, setResults] = useState<{text: string, places: any[]} | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, [activeCategory]);

  const fetchData = async () => {
    try {
      let allItems: any[] = [];
      
      if (activeCategory === 'sentiers') {
        // Chargement des signalements réels + locaux pour Sentiers
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('reports_')) {
            const data = JSON.parse(localStorage.getItem(key)!);
            if (Array.isArray(data)) allItems.push(...data);
          }
        }
        if (isRealSupabase && supabase) {
          const { data } = await supabase.from('waste_reports').select('*');
          if (data) allItems = [...data, ...allItems.filter(lr => !data.find(d => d.id === lr.id))];
        }
      } else if (activeCategory === 'palabre') {
        // Mocking Agora points pour Palabre (ou fetch real posts with location)
        allItems = [
          { id: 'p1', latitude: 5.3484, longitude: -4.0305, city: 'Cocody', nature: 'Grand Palabre : Souveraineté Digitale', timestamp: new Date().toISOString() },
          { id: 'p2', latitude: 7.6898, longitude: -5.0303, city: 'Bouaké', nature: 'Débat : L’Héritage des Griots', timestamp: new Date().toISOString() }
        ];
      } else {
        // Mocking Solidarity points pour Soutien
        allItems = [
          { id: 's1', latitude: 5.33, longitude: -4.02, city: 'Abidjan', nature: 'Don de 100 Manuels Scolaires', timestamp: new Date().toISOString() },
          { id: 's2', latitude: 9.40, longitude: -6.88, city: 'Odienné', nature: 'Banque Alimentaire Ouverte', timestamp: new Date().toISOString() }
        ];
      }

      setItems(allItems);
    } catch (e) { console.error("Erreur Empreinte:", e); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await findInitiatives(query, coords?.lat, coords?.lng);
      setResults(res);
    } catch (e) {
      console.error("Erreur lors de la recherche d'initiatives:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700 bg-[#fcfcfc] min-h-screen text-gray-900">
      <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors text-sm font-bold group p-2">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour Agora
      </Link>

      <section className="mb-16">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 mb-4 tracking-tighter leading-tight">Empreinte <span className="text-blue-600 italic">Territoriale</span></h1>
        <p className="text-gray-500 text-lg leading-relaxed italic font-medium max-w-2xl">
          L'action citoyenne dessine le visage de notre nation.
        </p>
      </section>

      <div className="relative w-full bg-white border border-gray-100 rounded-[3.5rem] shadow-sm overflow-hidden h-[500px] md:h-[750px] mb-20 group">
        <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-center">
          {/* Carte stylisée du pays */}
          <svg className="w-full h-full p-10 opacity-[0.12]" viewBox="0 0 800 600" fill="none" preserveAspectRatio="xMidYMid meet">
             <path d="M350 50 Q 420 20, 500 60 T 650 100 Q 750 150, 700 250 T 600 400 Q 550 550, 400 500 T 250 450 Q 150 400, 200 250 T 300 150 T 350 50" stroke="#2563eb" strokeWidth="2" strokeDasharray="8 8" />
          </svg>

          {/* Points de l'Empreinte */}
          {items.map((r) => {
            if (!r.latitude || !r.longitude) return null;
            const pos = convertCoordsToPercent(r.latitude, r.longitude);
            return <MapPoint key={r.id} x={pos.x} y={pos.y} city={r.city} label={r.nature} category={activeCategory} />;
          })}

          {items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md px-10 py-6 rounded-[2.5rem] border border-gray-100 shadow-2xl text-center">
                <Locate className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Aucune onde identifiée dans ce cercle</p>
              </div>
            </div>
          )}
        </div>

        {/* SÉLECTEUR DE CATÉGORIES VERTICAL (Style Screenshot) */}
        <div className="absolute top-10 left-10 flex flex-col gap-3 z-50">
           <button 
             onClick={() => setActiveCategory('sentiers')}
             className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 ${activeCategory === 'sentiers' ? 'bg-white text-blue-600 border border-blue-100 ring-2 ring-blue-50' : 'bg-white/80 backdrop-blur-md text-gray-400 border border-transparent'}`}
           >
             <div className={`w-2.5 h-2.5 rounded-full ${activeCategory === 'sentiers' ? 'bg-blue-600 animate-pulse' : 'bg-blue-200'}`}></div> Sentiers
           </button>
           <button 
             onClick={() => setActiveCategory('palabre')}
             className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 ${activeCategory === 'palabre' ? 'bg-white text-amber-600 border border-amber-100 ring-2 ring-amber-50' : 'bg-white/80 backdrop-blur-md text-gray-400 border border-transparent'}`}
           >
             <div className={`w-2.5 h-2.5 rounded-full ${activeCategory === 'palabre' ? 'bg-amber-600 animate-pulse' : 'bg-amber-200'}`}></div> Palabre
           </button>
           <button 
             onClick={() => setActiveCategory('soutien')}
             className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 ${activeCategory === 'soutien' ? 'bg-white text-emerald-600 border border-emerald-100 ring-2 ring-emerald-50' : 'bg-white/80 backdrop-blur-md text-gray-400 border border-transparent'}`}
           >
             <div className={`w-2.5 h-2.5 rounded-full ${activeCategory === 'soutien' ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-200'}`}></div> Soutien
           </button>
        </div>
        
        <div className="absolute bottom-10 right-10 flex flex-col gap-4">
           <button onClick={fetchData} className="w-16 h-16 bg-white border border-gray-100 text-gray-900 rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95">
             <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-5 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif font-bold text-gray-950 flex items-center gap-4">
                  <ShieldCheck className="text-blue-600" /> Registre de l'Impact
                </h3>
                <span className="bg-gray-50 text-gray-400 text-[9px] font-black uppercase px-3 py-1 rounded-full">{items.length} ondes</span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                {items.length > 0 ? items.map(r => (
                  <div key={r.id} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                     <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${activeCategory === 'sentiers' ? 'text-blue-500' : activeCategory === 'palabre' ? 'text-amber-500' : 'text-emerald-500'}`}>{r.city || 'Position scellée'}</span>
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                           <Locate size={12} className="text-gray-400" />
                        </div>
                     </div>
                     <p className="font-bold text-gray-800 text-[13px]">{r.nature}</p>
                     <div className="flex justify-between items-center mt-3">
                        <p className="text-[8px] text-gray-400 font-mono tracking-tighter">{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</p>
                        <p className="text-[8px] font-black text-gray-300 uppercase">{new Date(r.timestamp || r.created_at || '').toLocaleDateString()}</p>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                    <List className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-300 font-bold uppercase text-[9px] tracking-widest">Aucune donnée archivée</p>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 space-y-12">
          <div className="bg-blue-600 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform"><Globe size={120} /></div>
             <h3 className="text-2xl font-serif font-bold mb-4">Intelligence du Territoire</h3>
             <p className="text-blue-100 mb-10 font-medium leading-relaxed">Interrogez l'intelligence collective pour découvrir les projets proches de vous.</p>
             <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une école, un marché, un soutien..."
                  className="w-full bg-white border-none py-6 pl-16 pr-4 rounded-2xl shadow-xl outline-none text-gray-900 font-bold"
                />
                <button type="submit" disabled={loading} className="absolute right-3 top-3 bottom-3 bg-gray-900 text-white px-8 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all">
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "IA"}
                </button>
             </form>
          </div>

          {results && (
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm animate-in slide-in-from-bottom-4">
              <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-6">Résonance Territoriale</h4>
              <p className="text-gray-700 leading-relaxed font-medium mb-8 whitespace-pre-wrap">{results.text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.places.map((p: any, i: number) => (
                  <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm"><MapPin size={18} /></div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs truncate">{p.web?.title || 'Lieu identifié'}</p>
                      <a href={p.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 font-black uppercase flex items-center gap-1 hover:underline">Voir <ExternalLink size={8} /></a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionMap;
