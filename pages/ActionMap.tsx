
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Loader2, Navigation, ExternalLink, Info, 
  Globe, Sparkles, Map as MapIcon, ShieldCheck, Flag, Zap, 
  Users, Building2, Landmark, ChevronLeft, ArrowRight, Trash2,
  RefreshCw, List, Locate
} from 'lucide-react';
import { findInitiatives } from '../lib/gemini';
import { Link } from 'react-router-dom';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { WasteReport } from '../types.ts';

const convertCoordsToPercent = (lat: number, lng: number) => {
  // Côte d'Ivoire Bounding Box
  const latMin = 4.0, latMax = 11.0;
  const lngMin = -9.0, lngMax = -2.0;
  
  const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
  
  // Si en dehors des bornes, on le place au bord
  return { 
    x: Math.max(2, Math.min(98, x)) + "%", 
    y: Math.max(2, Math.min(98, y)) + "%" 
  };
};

const MapPoint = ({ x, y, label, city }: any) => {
  return (
    <div className="absolute group cursor-pointer" style={{ left: x, top: y }}>
       <div className={`absolute -inset-4 rounded-full bg-red-600 opacity-20 animate-ping`}></div>
       <div className={`w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-2xl transition-all group-hover:scale-150 z-10`}></div>
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30">
          <div className="bg-gray-950 text-white p-4 rounded-2xl text-[10px] font-bold text-center shadow-3xl border border-white/10 backdrop-blur-xl">
             <p className="text-red-400 font-black uppercase text-[8px] mb-1 tracking-widest">{city || 'Alerte'}</p>
             <p className="leading-tight">{label}</p>
             <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-950"></div>
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
      () => {}
    );
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('waste_reports').select('*');
        if (data && data.length > 0) {
          setReports(data as any);
          return;
        }
      }
      
      const allLocal: WasteReport[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('reports_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key)!);
            if (Array.isArray(data)) allLocal.push(...data);
          } catch(e) {}
        }
      }
      setReports(allLocal);
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
      setResults({ text: "Erreur IA recherche.", places: [] });
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
          Visualisez les alertes citoyennes scellées en temps réel sur le territoire national.
        </p>
      </section>

      <div className="relative w-full bg-white border border-gray-100 rounded-[3.5rem] shadow-sm overflow-hidden h-[500px] md:h-[750px] mb-20 group">
        <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-center">
          <svg className="w-full h-full p-10 opacity-[0.1]" viewBox="0 0 800 600" fill="none" preserveAspectRatio="xMidYMid meet">
             <path d="M350 50 Q 420 20, 500 60 T 650 100 Q 750 150, 700 250 T 600 400 Q 550 550, 400 500 T 250 450 Q 150 400, 200 250 T 300 150 T 350 50" stroke="#2563eb" strokeWidth="2" strokeDasharray="8 8" />
          </svg>

          {reports.map((r) => {
            if (!r.latitude || !r.longitude) return null;
            const pos = convertCoordsToPercent(r.latitude, r.longitude);
            return <MapPoint key={r.id} x={pos.x} y={pos.y} city={r.city} label={r.nature} />;
          })}

          {reports.filter(r => r.latitude && r.longitude).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/80 backdrop-blur-md px-8 py-5 rounded-3xl border border-gray-100 shadow-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Territoire sans anomalie scellée</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-10 left-10 flex flex-col gap-3">
           <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-100 shadow-xl text-[10px] font-black uppercase tracking-widest">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_8px_#dc2626]"></div> Alertes Réelles
           </div>
        </div>
        
        <div className="absolute bottom-10 right-10">
           <button onClick={fetchReports} className="w-16 h-16 bg-gray-900 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:bg-black transition-all border-4 border-white">
             <RefreshCw size={24} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <h3 className="text-2xl font-serif font-bold text-gray-950 mb-8 flex items-center gap-4">
                <ShieldCheck className="text-blue-600" /> Journal de l'Empreinte
              </h3>
              <div className="space-y-6 max-h-[400px] overflow-y-auto no-scrollbar">
                {reports.length > 0 ? [...reports].reverse().map(r => (
                  <div key={r.id} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{r.city || 'Position scellée'}</span>
                        <Locate size={10} className="text-emerald-500" />
                     </div>
                     <p className="font-bold text-gray-800 text-sm">{r.nature}</p>
                     <p className="text-[9px] text-gray-400 mt-2 font-mono">{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</p>
                  </div>
                )) : (
                  <p className="text-center py-10 text-gray-300 font-bold uppercase text-[10px] tracking-widest">Aucun signalement archivé</p>
                )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-12">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Explorer les initiatives locales..."
              className="w-full bg-white border border-gray-100 py-8 pl-20 pr-8 rounded-[2.5rem] shadow-xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-bold text-lg"
            />
            <button type="submit" disabled={loading} className="absolute right-4 top-4 bottom-4 bg-gray-900 text-white px-10 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Rechercher"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActionMap;
