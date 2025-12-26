
import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation, ExternalLink, Info, Globe, Sparkles, Map as MapIcon } from 'lucide-react';
// Corrected import name from findLocalInitiatives
import { findInitiatives } from '../lib/gemini';

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
      // Corrected function call to findInitiatives
      const res = await findInitiatives(query, coords?.lat, coords?.lng);
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200">
           <MapIcon className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Ancrage Territorial</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
          Localisez les forces vives de la nation. Grâce au grounding Google Maps, trouvez de réels points d'appui pour vos actions citoyennes.
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-20">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600">
            <Search className="w-7 h-7" />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: 'ONG reforestation Abidjan', 'Mairie de Yamoussoukro'..."
            className="w-full bg-white border border-gray-100 py-7 pl-16 pr-40 rounded-[2.5rem] shadow-2xl shadow-gray-100 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-xl font-medium"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-3 top-3 bottom-3 bg-gray-900 text-white px-10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
            Explorer
          </button>
        </form>
        {coords && (
          <p className="text-center mt-6 text-[11px] text-emerald-600 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Géolocalisation Citoyenne Active
          </p>
        )}
      </div>

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-1 space-y-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 px-4">Lieux Identifiés sur le Terrain</h3>
            <div className="space-y-4">
              {results.places.length > 0 ? results.places.map((chunk: any, i: number) => chunk.maps && (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform">
                    <MapPin className="w-16 h-16 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-4 leading-tight pr-8">{chunk.maps.title}</h4>
                  <div className="flex flex-col gap-3">
                    <a 
                      href={chunk.maps.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Ouvrir dans Maps <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )) : (
                <div className="p-16 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold">Aucune empreinte locale trouvée.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 md:p-14 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Sparkles className="w-40 h-40 text-blue-900" />
              </div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                  <Info className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-2xl text-gray-900">Analyse de Proximité</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Synthèse Géographique IA</p>
                </div>
              </div>
              <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                {results.text}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMap;
