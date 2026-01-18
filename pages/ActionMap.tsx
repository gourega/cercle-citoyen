
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
  // Côte d'Ivoire Bounding Box étendue pour tolérance
  const latMin = 4.0, latMax = 11.0;
  const lngMin = -9.0, lngMax = -2.0;
  
  const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
  
  // Placement sécurisé sur les bords si hors zone (pour les tests)
  return { 
    x: Math.max(5, Math.min(95, x)) + "%", 
    y: Math.max(5, Math.min(95, y)) + "%" 
  };
};

const MapPoint = ({ x, y, label, city }: any) => {
  return (
    <div className="absolute group cursor-pointer" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
       <div className={`absolute -inset-6 rounded-full bg-red-600 opacity-20 animate-pulse`}></div>
       <div className={`w-5 h-5 bg-red-600 rounded-full border-[3px] border-white shadow-2xl transition-all group-hover:scale-150 z-10`}></div>
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

    // Rafraîchir à chaque focus sur la fenêtre
    window.addEventListener('focus', fetchReports);
    return () => window.removeEventListener('focus', fetchReports);
  }, []);

  const fetchReports = async () => {
    try {
      let allReports: WasteReport[] = [];

      // 1. Récupération Locale (Priorité pour réactivité immédiate)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('reports_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key)!);
            if (Array.isArray(data)) {
              // On s'assure que les données locales sont formatées
              const mapped = data.map(r => ({
                ...r,
                latitude: r.latitude || r.lat, // Compatibilité clés
                longitude: r.longitude || r.lng
              }));
              allReports.push(...mapped);
            }
          } catch(e) {}
        }
      }

      // 2. Récupération Supabase (Si connectée)
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('waste_reports').select('*');
        if (data && data.length > 0) {
          // Fusion intelligente : on garde le serveur en priorité si ID identiques
          const serverIds = new Set(data.map(d => d.id));
          allReports = [
            ...data, 
            ...allReports.filter(lr => !serverIds.has(lr.id))
          ];
        }
      }
      
      // Tri par date décroissante
      const sorted = allReports.sort((a, b) => 
        new Date(b.timestamp || b.created_at || 0).getTime() - 
        new Date(a.timestamp || a.created_at || 0).getTime()
      );

      setReports(sorted);
    } catch (e) { console.error("Erreur Empreinte:", e); }
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
          {/* Carte stylisée du pays */}
          <svg className="w-full h-full p-10 opacity-[0.12]" viewBox="0 0 800 600" fill="none" preserveAspectRatio="xMidYMid meet">
             <path d="M350 50 Q 420 20, 500 60 T 650 100 Q 750 150, 700 250 T 600 400 Q 550 550, 400 500 T 250 450 Q 150 400, 200 250 T 300 150 T 350 50" stroke="#2563eb" strokeWidth="3" strokeDasharray="12 12" />
          </svg>

          {/* Points de signalement */}
          {reports.map((r) => {
            if (!r.latitude || !r.longitude) return null;
            const pos = convertCoordsToPercent(r.latitude, r.longitude);
            return <MapPoint key={r.id} x={pos.x} y={pos.y} city={r.city} label={r.nature} />;
          })}

          {reports.filter(r => r.latitude && r.longitude).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md px-10 py-6 rounded-[2.5rem] border border-gray-100 shadow-2xl text-center">
                <Locate className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Territoire sans anomalie scellée</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-10 left-10 flex flex-col gap-3">
           <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-100 shadow-xl text-[10px] font-black uppercase tracking-widest">
              <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_12px_#dc2626]"></div> {reports.length} Signalements Réels
           </div>
        </div>
        
        <div className="absolute bottom-10 right-10 flex flex-col gap-4">
           <button onClick={fetchReports} className="w-16 h-16 bg-gray-900 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:bg-black transition-all border-4 border-white active:scale-95">
             <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-5 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif font-bold text-gray-950 flex items-center gap-4">
                  <ShieldCheck className="text-blue-600" /> Journal de l'Empreinte
                </h3>
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-3 py-1 rounded-full">{reports.length}</span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{r.city || 'Position scellée'}</span>
                        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:bg-emerald-50 transition-colors">
                           <Locate size={12} className="text-emerald-500" />
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
                    <p className="text-gray-300 font-bold uppercase text-[9px] tracking-widest">Aucun signalement archivé</p>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 space-y-12">
          <div className="bg-blue-600 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform"><Globe size={120} /></div>
             <h3 className="text-2xl font-serif font-bold mb-4">Explorer les initiatives</h3>
             <p className="text-blue-100 mb-10 font-medium leading-relaxed">Utilisez l'intelligence du territoire pour trouver les actions citoyennes proches de votre position actuelle.</p>
             <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une école, un marché, une coopérative..."
                  className="w-full bg-white border-none py-6 pl-16 pr-4 rounded-2xl shadow-xl outline-none text-gray-900 font-bold"
                />
                <button type="submit" disabled={loading} className="absolute right-3 top-3 bottom-3 bg-gray-900 text-white px-8 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all">
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Lancer IA"}
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
                      <a href={p.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 font-black uppercase flex items-center gap-1 hover:underline">Voir l'Onde <ExternalLink size={8} /></a>
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
