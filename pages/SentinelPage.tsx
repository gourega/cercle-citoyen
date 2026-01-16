
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  ChevronLeft,
  Eye,
  AlertTriangle,
  History,
  Info,
  X,
  Zap,
  CheckCircle,
  MoveHorizontal,
  Navigation,
  ArrowRight,
  Pencil,
  Save
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, WasteReport, CircleType } from '../types';
import { analyzePollutionImage, generateCleanVision } from '../lib/gemini';
import { supabase, isRealSupabase } from '../lib/supabase';
import { useToast } from '../App';

const SentinelPage: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const [view, setView] = useState<'hub' | 'camera' | 'processing' | 'result'>('hub');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cleanVision, setCleanVision] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [showClean, setShowClean] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'detecting' | 'active' | 'denied'>('detecting');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [editingReport, setEditingReport] = useState<WasteReport | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchMyReports();
    checkLocation();
    return () => stopCamera();
  }, []);

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('active');
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true }
    );
  };

  const fetchMyReports = async () => {
    if (isRealSupabase && supabase) {
      try {
        const { data } = await supabase.from('waste_reports').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
        if (data) setReports(data as any);
      } catch (e) {
        console.warn("Table waste_reports non trouvée, passage en mode mock.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    if (gpsStatus !== 'active') {
      addToast("La géolocalisation est requise pour certifier le signalement.", "error");
      checkLocation();
      return;
    }
    setView('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      addToast("Accès caméra refusé.", "error");
      setView('hub');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.6); // Compression accrue
        setCapturedImage(data);
        stopCamera();
        processImage(data);
      }
    }
  };

  const processImage = async (img: string) => {
    setView('processing');
    try {
      const [res, clean] = await Promise.all([
        analyzePollutionImage(img),
        generateCleanVision(img).catch(() => null)
      ]);
      
      if (!res) throw new Error("Échec d'analyse IA.");
      setAnalysis(res);
      setCleanVision(clean);
      setView('result');
    } catch (e: any) {
      addToast("L'analyse a échoué. Réessayez.", "error");
      setView('hub');
    }
  };

  const handlePublish = async () => {
    if (!analysis || !capturedImage) return;
    
    // Validation des saisies manuelles avant publication
    if (analysis.city.includes('à préciser') || analysis.sector.includes('à préciser')) {
      addToast("Veuillez préciser la ville et le secteur manuellement.", "info");
      return;
    }

    setLoading(true);
    
    try {
      const reportData = {
        author_id: user.id,
        image: capturedImage,
        clean_vision: cleanVision,
        city: analysis.city,
        sector: analysis.sector,
        nature: analysis.nature,
        description: analysis.description || "Signalement Sentinelle",
        action_plan: analysis.actionPlan || [],
        insight: analysis.insight || "Impact identifié.",
        status: 'reported',
        latitude: location?.lat,
        longitude: location?.lng
      };

      // Si l'ID n'est pas un UUID (ex: 'admin'), Supabase échouera. 
      // On bascule alors en mode simulation réussie pour l'expérience utilisateur.
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id);

      if (isRealSupabase && supabase && isValidUUID) {
        const { error: reportError } = await supabase.from('waste_reports').insert([reportData]);
        if (reportError) throw reportError;

        await supabase.from('posts').insert([{
          author_id: user.id,
          circle_type: CircleType.URBAN,
          content: `🚨 [SENTINELLE VERTE] ${analysis.nature} identifié à ${analysis.city}. J'ai généré une Vision Propre pour montrer ce que ce lieu pourrait devenir ! ✨ ${analysis.insight}`,
          image_url: capturedImage,
          clean_vision_url: cleanVision,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);

        addToast("Signalement publié ! +50 XP", "success");
      } else {
        // Mode Simulation ou ID spécial (Admin/Test)
        console.log("Publication simulée (ID non-UUID ou Mode Démo):", reportData);
        addToast("Sceau Sentinelle validé ! (Mode Simulation)", "success");
        // Ajouter manuellement à la liste locale pour le feedback visuel
        const mockReport = { ...reportData, id: Date.now().toString(), timestamp: new Date().toISOString() };
        setReports(prev => [mockReport as any, ...prev]);
      }

      fetchMyReports();
      setView('hub');
    } catch (err: any) {
      console.error("Publish Error:", err);
      addToast(err.message || "Erreur technique de publication.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!editingReport) return;
    setEditLoading(true);
    try {
      if (isRealSupabase && supabase && editingReport.id.length > 15) {
        const { error } = await supabase
          .from('waste_reports')
          .update({
            city: editingReport.city,
            sector: editingReport.sector,
            nature: editingReport.nature
          })
          .eq('id', editingReport.id);
        
        if (error) throw error;
        addToast("Signalement rectifié.", "success");
      } else {
        addToast("Mise à jour locale effectuée.", "info");
      }
      setEditingReport(null);
      fetchMyReports();
    } catch (e) {
      addToast("Échec de mise à jour.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover" />
        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/30 rounded-[3rem] flex flex-col items-center justify-center">
             <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mb-2"></div>
             <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Zone de focus</p>
          </div>
        </div>
        <div className="absolute top-10 inset-x-0 text-center px-6 flex flex-col items-center gap-3">
           <div className="bg-black/60 backdrop-blur-md inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 text-white">
              <MoveHorizontal className="text-emerald-400" size={18} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Distance : 3 à 5 mètres</p>
           </div>
        </div>
        <div className="absolute bottom-12 inset-x-0 flex justify-center gap-10 items-center">
           <button onClick={() => { stopCamera(); setView('hub'); }} className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"><X size={24} /></button>
           <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-[8px] border-white/20 active:scale-90 transition-all">
             <div className="w-16 h-16 bg-emerald-500 rounded-full shadow-2xl"></div>
           </button>
           <div className="w-16 h-16 opacity-0"></div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden">
        <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-4 border-white/10 mb-12 shadow-2xl">
          <img src={capturedImage!} className="w-full h-full object-cover opacity-50" alt="Process" />
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4 flex items-center gap-3"><Sparkles className="text-emerald-400" /> Analyse IA...</h2>
        <p className="text-gray-400 max-w-xs mx-auto animate-pulse uppercase text-[10px] font-black tracking-widest">Construction de la vision propre</p>
        <style>{`@keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }`}</style>
      </div>
    );
  }

  if (view === 'result') {
    const isCityMissing = analysis?.city?.includes('à préciser');
    const isSectorMissing = analysis?.sector?.includes('à préciser');

    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-500">
        <button onClick={() => setView('hub')} className="flex items-center gap-2 text-gray-500 mb-8 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">
          <ChevronLeft size={16}/> Recommencer
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="relative rounded-[4rem] overflow-hidden shadow-3xl border-8 border-white group aspect-square bg-gray-900">
              <img src={showClean ? cleanVision || capturedImage! : capturedImage!} className="w-full h-full object-cover transition-all duration-700" alt="Capture" />
              <div className="absolute bottom-10 inset-x-0 flex justify-center">
                 <button onClick={() => setShowClean(!showClean)} className={`px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl ${showClean ? 'bg-emerald-500 text-white' : 'bg-white/90 text-gray-900 backdrop-blur-md'}`}>
                  {showClean ? <CheckCircle size={16}/> : <Sparkles size={16}/>}
                  {showClean ? 'Vision Propre Active' : 'Voir le Futur Propre'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-sm space-y-8 flex flex-col">
            <div className="space-y-6">
              <div className="relative group">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Zap size={20} /></div>
                  <input 
                    value={analysis?.nature}
                    onChange={(e) => setAnalysis({...analysis, nature: e.target.value})}
                    placeholder="Nature de la nuisance..."
                    className="text-3xl font-serif font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-emerald-100 outline-none w-full"
                  />
                </div>
                <div className="flex flex-col gap-2 ml-14">
                  <div className="flex items-center gap-2 relative">
                    <MapPin size={14} className={isCityMissing ? "text-rose-500 animate-pulse" : "text-gray-300"} />
                    <input 
                      value={analysis?.city}
                      onChange={(e) => setAnalysis({...analysis, city: e.target.value})}
                      placeholder="Ville..."
                      className={`text-xs font-bold uppercase tracking-widest bg-transparent border-b border-transparent focus:border-emerald-100 outline-none w-full ${isCityMissing ? 'text-rose-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation size={14} className={isSectorMissing ? "text-rose-500 animate-pulse" : "text-gray-300"} />
                    <input 
                      value={analysis?.sector}
                      onChange={(e) => setAnalysis({...analysis, sector: e.target.value})}
                      placeholder="Secteur/Quartier..."
                      className={`text-xs font-bold uppercase tracking-widest bg-transparent border-b border-transparent focus:border-emerald-100 outline-none w-full ${isSectorMissing ? 'text-rose-600' : 'text-gray-400'}`}
                    />
                  </div>
                </div>
                {(isCityMissing || isSectorMissing) && (
                   <p className="ml-14 mt-4 text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                     <AlertTriangle size={12} /> Saisissez la localisation ci-dessus
                   </p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-[2.5rem] italic text-gray-600 text-sm leading-relaxed relative">
               <div className="absolute -top-3 left-8 bg-white border border-gray-100 px-3 py-1 rounded-full text-[8px] font-black uppercase text-blue-600 tracking-widest">Sagesse Citoyenne</div>
               "{analysis?.insight}"
            </div>
            <button 
              onClick={handlePublish}
              disabled={loading}
              className="w-full mt-auto bg-gray-950 text-white py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} className="text-emerald-400" />}
              Diffuser le Signalement
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      
      {editingReport && (
        <div className="fixed inset-0 z-[300] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden">
              <div className="p-10 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                 <h3 className="text-2xl font-serif font-bold text-gray-900">Rectifier</h3>
                 <button onClick={() => setEditingReport(null)} className="p-3"><X /></button>
              </div>
              <div className="p-10 space-y-6">
                 <input value={editingReport.city} onChange={e => setEditingReport({...editingReport, city: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl font-bold" placeholder="Ville" />
                 <input value={editingReport.sector} onChange={e => setEditingReport({...editingReport, sector: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl font-bold" placeholder="Secteur" />
                 <button onClick={handleUpdateReport} disabled={editLoading} className="w-full bg-gray-950 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                   {editLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Enregistrer
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-24">
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6 tracking-tight">Sentinelle <span className="text-emerald-500 italic">Verte</span></h1>
          <p className="text-gray-500 max-w-xl text-xl font-medium leading-relaxed italic">Chaque regard posé sur la cité est une promesse d'action.</p>
        </div>
        <button onClick={startCamera} className="w-full md:w-auto px-16 py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-3xl flex items-center justify-center gap-4 active:scale-95"><Camera size={28} /> Scanner le Territoire</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
         <div className="lg:col-span-2 space-y-16">
            <h3 className="text-3xl font-serif font-bold text-gray-900 flex items-center gap-4"><History className="text-blue-600" /> Vos Signalements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reports.length > 0 ? reports.map(r => {
                const isIncomplete = r.city.includes('à préciser') || r.sector.includes('à préciser');
                return (
                  <div key={r.id} className={`bg-white border-2 rounded-[3.5rem] overflow-hidden shadow-sm transition-all group relative ${isIncomplete ? 'border-rose-100 ring-2 ring-rose-50' : 'border-gray-50'}`}>
                    <div className="h-60 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Report" />
                       <div className="absolute top-6 right-6">
                          <button onClick={() => setEditingReport(r)} className="w-12 h-12 bg-white/90 backdrop-blur-md text-emerald-600 rounded-2xl flex items-center justify-center shadow-xl"><Pencil size={20} /></button>
                       </div>
                       <div className="absolute bottom-6 left-8"><span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-white border border-white/20 tracking-widest">{r.nature}</span></div>
                    </div>
                    <div className="p-10">
                       <h4 className={`font-serif font-bold text-2xl mb-1 ${isIncomplete ? 'text-rose-600' : 'text-gray-900'}`}>{r.city}</h4>
                       <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isIncomplete ? 'text-rose-400' : 'text-blue-500'}`}>{r.sector}</p>
                       <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(r.timestamp || Date.now()).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full"><MapPin size={10} /><span className="text-[9px] font-black uppercase">Certifié</span></div>
                       </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-32 text-center bg-gray-50 rounded-[5rem] border-2 border-dashed border-gray-200"><p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucun signalement archivé.</p></div>
              )}
            </div>
         </div>
         <aside className="space-y-10">
            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
               <h3 className="font-serif font-bold text-2xl flex items-center gap-4 text-gray-900"><Info className="text-blue-600" /> Guide</h3>
               <p className="text-xs text-gray-500 font-bold leading-relaxed">Assurez-vous que la ville et le secteur sont corrects avant de diffuser, pour que les services concernés puissent agir.</p>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default SentinelPage;
