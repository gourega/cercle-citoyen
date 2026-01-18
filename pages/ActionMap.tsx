
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Loader2, Navigation, ExternalLink, Info, 
  Globe, Sparkles, Map as MapIcon, ShieldCheck, Flag, Zap, 
  Users, Building2, Landmark, ChevronLeft, ArrowRight, Trash2
} from 'lucide-react';
import { findInitiatives } from '../lib/gemini';
import { Link } from 'react-router-dom';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { WasteReport } from '../types.ts';

// Conversion approximative des coordonnées GPS en % de position sur l'image SVG de la carte
const convertCoordsToPercent = (lat: number, lng: number) => {
  // Limites approximatives de la Côte d'Ivoire
  const latMin = 4.3, latMax = 10.7;
  const lngMin = -8.6, lngMax = -2.5;
  
  const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
  
  return { 
    x: Math.max(10, Math.min(90, x)) + "%", 
    y: Math.max(10, Math.min(90, y)) + "%" 
  };
};

const MapPoint = ({ x, y, type, label, city, description }: any) => {
  const colors = {
    action: 'bg-emerald-500',
    palabre: 'bg-amber-500',
    solidarity: 'bg-rose-500',
    waste: 'bg-red-600'
  };
  
  return (
    <div className="absolute group cursor-pointer" style={{ left: x, top: y }}>
       <div className={`absolute -inset-4 rounded-full ${colors[type as keyof typeof colors]} opacity-10 animate-ping`}></div>
       <div className={`w-4 h-4 ${colors[type as keyof typeof colors]} rounded-full border-2 border-white shadow-lg transition-all group-hover:scale-150 z-10`}></div>
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30">
          <div className="bg-gray-900 text-white p-4 rounded-2xl text-[10px] font-bold text-center shadow-2xl border border-white/10 backdrop-blur-md">
             <p className="text-blue-400 font-black uppercase text-[8px] mb-1 tracking-widest">{city}</p>
             <p className="leading-tight mb-2">{label}</p>
             {description && <p className="text-[7px] text-gray-400 line-clamp-2 italic">"{description}"</p>}
             <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
          </div>
       </div>
    </div>
  );
};

const ActionMap: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [results, setResults] = useState<{text: string, places: any[]} | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("Location access denied")
    );
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('waste_reports').select('*');
        if (data) setReports(data as any);
      } else {
        // Fallback local pour démo si pas de DB
        const allLocal = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('reports_')) {
            const data = JSON.parse(localStorage.getItem(key)!);
            allLocal.push(...data);
          }
        }
        setReports(allLocal);
      }
    } catch (e) { console.error(e); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await findInitiatives(query, coords?.lat, coords?.lng);
      setResults(res);
    } catch (e) {
      console.error(e);
      setResults({ text: "La recherche rencontre une difficulté temporaire.", places: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 animate-in fade-in duration-700 bg-[#fcfcfc] min-h-screen">
      <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors text-sm font-bold group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour Agora
      </Link>

      <section className="mb-12">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Empreinte Territoriale</h1>
        <p className="text-gray-500 text-lg leading-relaxed italic font-medium">L'action citoyenne dessine le visage de notre nation.</p>
      </section>

      <div className="relative w-full bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden h-[500px] md:h-[700px] mb-12">
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          {/* Fond de carte Stylisé */}
          <svg className="w-full h-full p-20 opacity-[0.2]" viewBox="0 0 800 600" fill="none">
             <path d="M350 50 Q 420 20, 500 60 T 650 100 Q 750 150, 700 250 T 600 400 Q 550 550, 400 500 T 250 450 Q 150 400, 200 250 T 300 150 T 350 50" stroke="#2563eb" strokeWidth="4" />
          </svg>

          {/* Points dynamiques des signalements réels */}
          {reports.map((r) => {
            if (!r.latitude || !r.longitude) return null;
            const pos = convertCoordsToPercent(r.latitude, r.longitude);
            return (
              <MapPoint 
                key={r.id} 
                x={pos.x} 
                y={pos.y} 
                type="waste" 
                city={r.city} 
                label={r.nature} 
                description={r.description} 
              />
            );
          })}

          {/* Points Statiques de démonstration */}
          <MapPoint x="55%" y="78%" city="Abidjan" type="solidarity" label="Pôle de Solidarité" />
          <MapPoint x="48%" y="45%" city="Yamoussoukro" type="action" label="Agriculture Souveraine" />
          <MapPoint x="42%" y="30%" city="Bouaké" type="palabre" label="Grand Palabre" />
        </div>

        <div className="absolute top-6 left-6 flex flex-col gap-2">
           <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border border-gray-100 shadow-sm text-[9px] font-black uppercase">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Sentiers
           </div>
           <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border border-gray-100 shadow-sm text-[9px] font-black uppercase">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div> Alertes Citoyennes
           </div>
           <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border border-gray-100 shadow-sm text-[9px] font-black uppercase">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div> Solidarité
           </div>
        </div>
        
        <div className="absolute bottom-6 right-6">
           <button onClick={fetchReports} className="p-4 bg-white rounded-2xl shadow-xl border border-gray-100 hover:scale-105 transition-all text-blue-600">
             <RefreshCw size={20} />
           </button>
        </div>
      </div>

      <section className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative mb-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Trouver une initiative locale ou un acteur..."
            className="w-full bg-white border border-gray-100 py-6 pl-16 pr-4 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all font-medium"
          />
          <button type="submit" disabled={loading} className="absolute right-3 top-3 bottom-3 bg-gray-900 text-white px-6 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Rechercher"}
          </button>
        </form>

        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="font-serif font-bold text-2xl mb-6 flex items-center gap-3"><Sparkles className="text-blue-600" /> Analyse IA</h3>
            <p className="text-gray-700 leading-relaxed italic mb-8">"{results.text}"</p>
            <div className="space-y-4">
              {results.places.map((chunk: any, i: number) => chunk.maps && (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-sm text-gray-900">{chunk.maps.title}</span>
                  <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"><ExternalLink size={16} /></a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

import { RefreshCw } from 'lucide-react';
export default ActionMap;
