
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  ChevronLeft,
  X,
  Zap,
  CheckCircle,
  Navigation,
  Pencil,
  Save,
  FileText,
  Info,
  RotateCcw,
  LogOut,
  Target,
  Maximize,
  ArrowRight,
  Focus
} from 'lucide-react';
import { User, WasteReport, CircleType } from '../types.ts';
import { analyzePollutionImage, generateCleanVision } from '../lib/gemini.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { useToast } from '../ToastContext.tsx';

const SentinelPage: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [view, setView] = useState<'hub' | 'instructions' | 'camera' | 'processing' | 'result' | 'success'>('hub');
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cleanVision, setCleanVision] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [showClean, setShowClean] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [simulatedDistance, setSimulatedDistance] = useState("2.5m");
  
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

  // Simulation d'une distance qui change légèrement
  useEffect(() => {
    if (view === 'camera') {
      const interval = setInterval(() => {
        const d = (Math.random() * 2 + 1.5).toFixed(1);
        setSimulatedDistance(`${d}m`);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [view]);

  const checkLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("GPS non disponible"),
        { enableHighAccuracy: true }
      );
    }
  };

  const fetchMyReports = async () => {
    if (isRealSupabase && supabase) {
      try {
        const { data } = await supabase.from('waste_reports').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
        if (data) setReports(data as any);
      } catch (e) {
        console.warn("Simulé.");
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
    setCapturedImage(null);
    setAnalysis(null);
    setCleanVision(null);
    setView('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      addToast("Caméra inaccessible", "error");
      setView('hub');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.6);
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
      
      if (!res) throw new Error("Échec d'analyse.");
      
      setAnalysis({
        ...res,
        actionPlan: res.actionPlan || ["Sécuriser", "Informer", "Suivre"]
      });
      setCleanVision(clean);
      setView('result');
    } catch (e: any) {
      addToast("Analyse impossible", "error");
      setView('hub');
    }
  };

  const handlePublish = async () => {
    if (!analysis || !capturedImage || loading) return;
    setLoading(true);
    
    const reportData = {
      author_id: user.id,
      image: capturedImage,
      clean_vision: cleanVision,
      city: analysis.city,
      sector: analysis.sector,
      nature: analysis.nature,
      description: analysis.description,
      action_plan: analysis.actionPlan,
      insight: analysis.insight,
      status: 'reported',
      latitude: location?.lat,
      longitude: location?.lng
    };

    try {
      if (isRealSupabase && supabase) {
        await supabase.from('waste_reports').insert([reportData]);
        await supabase.from('posts').insert([{
          author_id: user.id,
          circle_type: CircleType.URBAN,
          content: `🚨 [SENTINELLE] ${analysis.nature} à ${analysis.city}. Vision Propre disponible ! ✨ ${analysis.insight}`,
          image_url: capturedImage,
          clean_vision_url: cleanVision,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);
      }
      addToast("Signalement archivé", "success");
      setView('success');
    } catch (err: any) {
      addToast("Erreur serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!editingReport || editLoading) return;
    setEditLoading(true);
    try {
      if (isRealSupabase && supabase) {
        await supabase.from('waste_reports').update({ city: editingReport.city, sector: editingReport.sector }).eq('id', editingReport.id);
        addToast("Rectification enregistrée", "success");
      }
      setEditingReport(null);
      fetchMyReports();
    } catch (e) {
      addToast("Erreur", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // VUES SPECIFIQUES
  if (view === 'instructions') {
    return (
      <div className="fixed inset-0 z-[300] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
           <div className="bg-emerald-600 p-8 text-white relative">
              <button onClick={() => setView('hub')} className="absolute top-6 right-6 opacity-60 hover:opacity-100 transition-opacity"><X size={24} /></button>
              <ShieldCheck size={48} className="mb-4" />
              <h2 className="text-3xl font-serif font-bold">Protocole Sentinelle</h2>
              <p className="text-emerald-100 text-sm mt-1 uppercase tracking-widest font-black text-[9px]">Analyse de salubrité territoriale</p>
           </div>
           <div className="p-8 md:p-10">
              <div className="space-y-8">
                 {[
                   { icon: <Camera size={20} />, title: "Capture de l'Anomalie", desc: "Photographiez la nuisance urbaine (ordures, épave, obstruction)." },
                   { icon: <Sparkles size={20} />, title: "Scan & Localisation", desc: "L'IA identifie la nature exacte et valide votre position géographique." },
                   { icon: <Zap size={20} />, title: "Vision Propre", desc: "Le système génère une projection du lieu réhabilité pour inspirer le changement." },
                   { icon: <CheckCircle size={20} />, title: "Engagement du Cercle", desc: "Le signalement est archivé et partagé pour mobiliser l'action citoyenne." }
                 ].map((step, i) => (
                   <div key={i} className="flex gap-6 items-start">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-50 shadow-sm">{step.icon}</div>
                      <div>
                         <h4 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h4>
                         <p className="text-gray-500 text-xs leading-relaxed font-medium">{step.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <button 
                onClick={startCamera} 
                className="w-full mt-12 bg-gray-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3"
              >
                Activer le Scrutateur <ArrowRight size={18} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500 text-gray-900">
         <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-10 text-emerald-500 shadow-xl">
            <CheckCircle2 size={48} className="animate-bounce" />
         </div>
         <h2 className="text-3xl font-serif font-bold mb-4 text-center">Plan scellé</h2>
         <p className="text-gray-500 text-center max-w-sm mb-12 font-medium">Votre signalement a été certifié par le système Sentinelle.</p>
         <button onClick={() => { fetchMyReports(); setView('hub'); }} className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Retour au Hub</button>
      </div>
    );
  }

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover opacity-80" />
        
        {/* Overlay Technique */}
        <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20">
           {/* Réticule de visée */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-emerald-500/30 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500"></div>
           </div>

           {/* Distance Dynamique */}
           <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-500/50 flex items-center gap-3">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Distance :</span>
              <span className="text-lg font-mono text-white font-bold">{simulatedDistance}</span>
           </div>

           {/* Stats latérales */}
           <div className="absolute top-1/2 -translate-y-1/2 left-8 flex flex-col gap-4">
              <div className="flex flex-col"><span className="text-[7px] text-gray-500 font-bold uppercase">ISO</span><span className="text-[10px] text-white font-mono">400</span></div>
              <div className="flex flex-col"><span className="text-[7px] text-gray-500 font-bold uppercase">SHUTTER</span><span className="text-[10px] text-white font-mono">1/60</span></div>
              <div className="flex flex-col"><span className="text-[7px] text-emerald-500 font-bold uppercase">SENTINELLE-ID</span><span className="text-[10px] text-white font-mono">V4-X{user.id.slice(0,4)}</span></div>
           </div>
        </div>

        {/* Ajusteur de Profondeur (Slider) */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 h-64 w-12 flex flex-col items-center gap-3 pointer-events-auto">
           <span className="text-[8px] text-white font-black uppercase tracking-tighter">DEPTH</span>
           <div className="flex-1 w-1 bg-gray-800 rounded-full relative">
              <input 
                type="range" 
                min="0" max="100" 
                value={zoom * 20} 
                onChange={(e) => setZoom(parseInt(e.target.value) / 20)}
                className="absolute inset-x-0 h-full w-full opacity-0 cursor-pointer -rotate-180" 
                // Fix: Cast 'slider-vertical' to any to avoid TypeScript error with standard Appearance type
                style={{ appearance: 'slider-vertical' as any }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-emerald-500 rounded-full transition-all" style={{ height: `${zoom * 20}%` }}></div>
              <div className="absolute w-4 h-4 bg-white rounded-full border-2 border-emerald-500 -left-1.5 transition-all shadow-lg" style={{ bottom: `${zoom * 20}%` }}></div>
           </div>
           <Focus className="text-emerald-500" size={16} />
        </div>

        {/* Barre d'Actions Caméra */}
        <div className="absolute top-8 left-8 pointer-events-auto">
          <button onClick={() => { stopCamera(); setView('hub'); }} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"><X size={24} /></button>
        </div>

        <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-12 pointer-events-auto">
           <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40"><RotateCcw size={20}/></div>
           <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-[8px] border-white/20 active:scale-90 transition-all shadow-3xl">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                 <Camera className="text-white" size={32} />
              </div>
           </button>
           <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40"><Maximize size={20}/></div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-8 text-center text-gray-900">
        <div className="relative w-full max-w-xs aspect-square rounded-[2rem] overflow-hidden border-4 border-gray-100 mb-12 shadow-2xl">
          <img src={capturedImage!} className="w-full h-full object-cover opacity-60" alt="Process" />
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
        <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-3 justify-center text-gray-900"><Sparkles className="text-emerald-500" /> Analyse IA en cours...</h2>
        <p className="text-gray-400 max-w-xs mx-auto animate-pulse text-[9px] font-black uppercase tracking-widest">Calcul de la Vision Propre et du Plan d'Action</p>
        <style>{`@keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }`}</style>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-500 text-gray-900 bg-[#fcfcfc] min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setView('hub')} className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest">
            <ChevronLeft size={16}/> Annuler
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white aspect-square bg-gray-50">
            <img src={showClean ? cleanVision || capturedImage! : capturedImage!} className="w-full h-full object-cover transition-all" alt="" />
            <button onClick={() => setShowClean(!showClean)} className={`absolute bottom-8 inset-x-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${showClean ? 'bg-emerald-500 text-white' : 'bg-white/90 text-gray-900'}`}>
              {showClean ? 'Vision Propre Active' : 'Voir le Futur Propre'}
            </button>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-8 flex flex-col border border-gray-100">
            <input value={analysis?.nature} onChange={(e) => setAnalysis({...analysis, nature: e.target.value})} className="text-2xl font-serif font-bold text-gray-900 bg-transparent outline-none w-full" />
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><FileText size={12}/> Plan d'Intervention</h4>
               <div className="space-y-2">
                 {analysis?.actionPlan?.map((step: string, i: number) => (
                   <div key={i} className="flex gap-3 items-center bg-gray-50 p-4 rounded-xl border border-gray-100 text-[13px] font-bold text-gray-700">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                      {step}
                   </div>
                 ))}
               </div>
            </div>
            <button onClick={handlePublish} disabled={loading} className="w-full mt-auto bg-gray-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-black transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} className="text-emerald-400" />} Publier
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 bg-[#fcfcfc] min-h-screen text-gray-900">
      <div className="mb-12"><button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-gray-400 font-bold text-xs hover:text-gray-900 transition-colors"><ChevronLeft size={16}/> Retour Agora</button></div>
      {editingReport && (
        <div className="fixed inset-0 z-[300] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8">
              <h3 className="text-xl font-serif font-bold mb-6">Rectifier la localisation</h3>
              <input value={editingReport.city} onChange={e => setEditingReport({...editingReport, city: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl mb-4 font-bold outline-none border border-transparent focus:border-blue-100" placeholder="Ville" />
              <input value={editingReport.sector} onChange={e => setEditingReport({...editingReport, sector: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl mb-6 font-bold outline-none border border-transparent focus:border-blue-100" placeholder="Quartier" />
              <button onClick={handleUpdateReport} disabled={editLoading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black">Enregistrer</button>
           </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-20">
        <div><h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Sentinelle <span className="text-emerald-500">Verte</span></h1><p className="text-gray-400 text-lg font-medium italic">Veillez sur votre territoire.</p></div>
        <button 
          onClick={() => setView('instructions')} 
          className="w-full md:w-auto px-12 py-6 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all"
        >
          <Camera size={24} /> Scanner l'Anomalie
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         <div className="lg:col-span-2 space-y-12">
            <h3 className="text-2xl font-serif font-bold flex items-center gap-4">Vos Signalements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="h-48 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover" alt="" />
                       <button onClick={() => setEditingReport(r)} className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md text-emerald-600 rounded-xl flex items-center justify-center shadow-lg"><Pencil size={18} /></button>
                    </div>
                    <div className="p-6">
                       <h4 className="font-serif font-bold text-xl mb-1">{r.city}</h4>
                       <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest">{r.sector}</p>
                    </div>
                  </div>
              )) : (
                <div className="col-span-full py-20 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem]"><p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Aucun signalement.</p></div>
              )}
            </div>
         </div>
         <aside className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-fit">
            <h3 className="font-serif font-bold text-xl mb-4 flex items-center gap-2"><Info size={20} className="text-emerald-500" /> Guide Citoyen</h3>
            <p className="text-[13px] text-gray-500 leading-relaxed font-medium">Capturez les anomalies urbaines pour générer un plan d'action certifié par l'intelligence souveraine du Cercle. Votre action directe est le premier levier de changement.</p>
         </aside>
      </div>
    </div>
  );
};

export default SentinelPage;
