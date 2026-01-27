
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
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
  Focus,
  Scan,
  History,
  Layers,
  AlertTriangle,
  Locate,
  Wifi
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
  const [location, setLocation] = useState<{lat: number, lng: number, accuracy?: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [simulatedDistance, setSimulatedDistance] = useState("2.5m");
  const [simulatedDepth, setSimulatedDepth] = useState("F/1.8");
  const [isFlashing, setIsFlashing] = useState(false);
  
  const [editingReport, setEditingReport] = useState<WasteReport | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Démarrer le tracking GPS dès le montage du composant pour être prêt
  useEffect(() => {
    startGpsTracking();
    fetchMyReports();
    return () => {
      stopCamera();
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const startGpsTracking = () => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          console.warn("GPS error:", err);
          if (view === 'camera' || view === 'result') {
            addToast("Signal GPS perdu. L'empreinte territoriale risque d'être imprécise.", "info");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const fetchMyReports = async () => {
    if (isRealSupabase && supabase) {
      try {
        const { data } = await supabase.from('waste_reports').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setReports(data as any);
          return;
        }
      } catch (e) {}
    }
    loadLocalReports();
  };

  const loadLocalReports = () => {
    const saved = localStorage.getItem(`reports_${user.id}`);
    if (saved) setReports(JSON.parse(saved));
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
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      addToast("Caméra inaccessible. Vérifiez les permissions.", "error");
      setView('hub');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsFlashing(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(data);
        
        // On capture le point GPS exact à l'instant T
        const finalLat = location?.lat;
        const finalLng = location?.lng;

        setTimeout(() => {
          setIsFlashing(false);
          stopCamera();
          processImage(data, finalLat, finalLng);
        }, 200);
      }
    }
  };

  const processImage = async (img: string, lat?: number, lng?: number) => {
    setView('processing');
    try {
      const analysisPromise = analyzePollutionImage(img);
      const visionPromise = generateCleanVision(img).catch(() => null);
      const [res, clean] = await Promise.all([analysisPromise, visionPromise]);
      
      if (!res) {
        setAnalysis({
          city: "Localité à préciser",
          sector: "Secteur à identifier",
          nature: "Signalement Citoyen",
          status: "reported",
          description: "Anomalie urbaine détectée.",
          actionPlan: ["Sécuriser les lieux", "Informer le voisinage", "Lancer une Quête de nettoyage"],
          insight: "Le regard du citoyen est la première lumière de la Cité.",
          lat, 
          lng
        });
        addToast("IA indécise. Complétez manuellement.", "info");
      } else {
        setAnalysis({ ...res, actionPlan: res.actionPlan || ["Nettoyer", "Sensibiliser"], lat, lng });
        setCleanVision(clean);
      }
      setView('result');
    } catch (e: any) {
      addToast("Erreur IA. Retour au hub.", "error");
      setView('hub');
    }
  };

  const handlePublish = async () => {
    if (!analysis || !capturedImage || loading) return;
    
    setLoading(true);
    const reportData = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
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
      latitude: analysis.lat || location?.lat,
      longitude: analysis.lng || location?.lng
    };

    try {
      if (isRealSupabase && supabase) {
        await supabase.from('waste_reports').insert([reportData]);
        await supabase.from('posts').insert([{
          author_id: user.id,
          circle_type: CircleType.URBAN,
          content: `🚨 [SENTINELLE VERTE] ${analysis.nature} à ${analysis.city}. Vision Citoyenne Propre disponible ! ✨ "${analysis.insight}"`,
          image_url: capturedImage,
          clean_vision_url: cleanVision,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);
      }
      
      const updatedReports = [reportData as any, ...reports];
      setReports(updatedReports);
      localStorage.setItem(`reports_${user.id}`, JSON.stringify(updatedReports));

      addToast("Onde scellée et archivée !", "success");
      setView('success');
    } catch (err: any) {
      addToast("Erreur d'archivage", "error");
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
      }
      const updated = reports.map(r => r.id === editingReport.id ? editingReport : r);
      setReports(updated);
      localStorage.setItem(`reports_${user.id}`, JSON.stringify(updated));
      addToast("Position rectifiée !", "success");
      setEditingReport(null);
    } catch (e) { addToast("Erreur technique", "error"); } finally { setEditLoading(false); }
  };

  if (view === 'instructions') {
    return (
      <div className="fixed inset-0 z-[300] bg-gray-950/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-500">
           <div className="bg-emerald-600 p-10 text-white relative">
              <button onClick={() => setView('hub')} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all p-2"><X size={28} /></button>
              <ShieldCheck size={56} className="mb-6" />
              <h2 className="text-4xl font-serif font-bold leading-tight">Protocole<br/>Sentinelle</h2>
           </div>
           <div className="p-10 space-y-8">
              <div className="space-y-6">
                 {[
                   { icon: <Locate size={22} />, title: "Géolocalisation Auto", desc: "Le système suit votre position en temps réel pour sceller l'empreinte territoriale dès la capture." },
                   { icon: <Camera size={22} />, title: "Capture IA", desc: "L'IA analyse instantanément la nuisance urbaine pour générer un plan d'action." },
                   { icon: <Zap size={22} />, title: "Vision Citoyenne", desc: "Projetez le futur propre du lieu pour inspirer la communauté." }
                 ].map((step, i) => (
                   <div key={i} className="flex gap-6 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm">{step.icon}</div>
                      <div>
                         <h4 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h4>
                         <p className="text-gray-500 text-xs leading-relaxed font-medium">{step.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <button onClick={startCamera} className="w-full mt-10 bg-gray-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95">Ouvrir le Scrutateur <ArrowRight size={20} /></button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[500] bg-black flex flex-col overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-1000" />
        <div className={`absolute inset-0 bg-white z-[600] pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className="absolute inset-0 z-[510] pointer-events-none flex flex-col justify-between p-8 md:p-12 select-none">
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col gap-3">
              <div className={`bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border flex items-center gap-4 shadow-2xl transition-colors duration-500 ${location ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
                 <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${location ? 'bg-emerald-500 shadow-emerald-500 animate-pulse' : 'bg-red-500 shadow-red-500'}`}></div>
                 <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${location ? 'text-emerald-400' : 'text-red-400'}`}>{location ? `Signal GPS Actif (${Math.round(location.accuracy || 0)}m)` : 'Acquisition GPS...'}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-3 w-fit">
                 <Wifi size={12} className="text-blue-400" />
                 <span className="text-[9px] font-black text-white uppercase tracking-widest">IA : Connectée</span>
              </div>
            </div>
            <button onClick={() => { stopCamera(); setView('hub'); }} className="p-5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10 pointer-events-auto"><X size={24} /></button>
          </div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 flex items-center justify-center">
            <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399]"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-emerald-400 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-400 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-emerald-400 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-emerald-400 rounded-br-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent w-1 h-full animate-[scanline_2s_ease-in-out_infinite] left-0"></div>
          </div>

          <div className="flex flex-col gap-6 items-start mb-24 md:mb-12">
             <div className="space-y-1 bg-black/30 p-3 rounded-xl border-l-2 border-emerald-500">
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Coordonnées</p>
                <p className="text-[10px] text-white font-mono">{location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'EN ATTENTE...'}</p>
             </div>
          </div>
          
          <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 h-80 flex flex-col items-center gap-4 pointer-events-auto">
             <div className="flex-1 w-1.5 bg-white/10 rounded-full relative overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-emerald-500/60" style={{ height: `${zoom * 20}%` }}></div>
                <input type="range" min="1" max="5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="absolute inset-y-0 w-full opacity-0 cursor-pointer -rotate-180" style={{ appearance: 'slider-vertical' as any }} />
             </div>
             <Focus className="text-emerald-400" size={20} />
          </div>
        </div>
        
        <div className="absolute bottom-16 inset-x-0 z-[520] flex justify-center items-center gap-12 md:gap-20">
           <button onClick={() => setZoom(1)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 pointer-events-auto"><RotateCcw size={24}/></button>
           <button onClick={capturePhoto} className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-[10px] border-white/20 active:scale-95 transition-all shadow-[0_0_50px_rgba(16,185,129,0.4)] group pointer-events-auto">
              <div className="w-18 h-18 bg-emerald-500 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"><Camera className="text-white" size={42} /></div>
           </button>
           <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 pointer-events-auto"><Maximize size={24}/></button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-8 text-center text-gray-900">
        <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-[12px] border-white shadow-3xl mb-16">
          <img src={capturedImage!} className="w-full h-full object-cover opacity-60 blur-sm scale-110" alt="Process" />
          <div className="absolute inset-x-0 top-0 h-2 bg-emerald-500 animate-[scan_2.5s_ease-in-out_infinite] z-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent flex items-end p-10">
             <div className="w-full space-y-4">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 shadow-[0_0_15px_#34d399] animate-[progress_4s_ease-in-out_infinite]"></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-white font-black uppercase tracking-[0.2em]"><span>Souveraineté Numérique</span><span className="animate-pulse">Calcul IA...</span></div>
             </div>
          </div>
        </div>
        <h2 className="text-4xl font-serif font-bold mb-6 flex items-center gap-5 justify-center text-gray-950"><Sparkles className="text-emerald-500 animate-pulse" size={32} /> Intelligence en Action</h2>
        <style>{`@keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } } @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-in fade-in duration-700 text-gray-900 bg-[#fcfcfc] min-h-screen">
        <div className="flex justify-between items-center mb-12">
          <button onClick={() => setView('hub')} className="flex items-center gap-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all group p-2">
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" /> Abandonner
          </button>
          {location && <div className="bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100 flex items-center gap-3"><Locate size={14} className="text-emerald-600"/><span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Position Scellée</span></div>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-10">
            <div className="relative rounded-[4rem] overflow-hidden shadow-3xl border-[16px] border-white aspect-square bg-gray-100 group">
              <img src={showClean ? (cleanVision || capturedImage!) : capturedImage!} className="w-full h-full object-cover transition-all duration-1000 ease-in-out" alt="Résultat" />
              <button onClick={() => setShowClean(!showClean)} className={`absolute bottom-10 inset-x-10 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-5 active:scale-95 ${showClean ? 'bg-emerald-600 text-white' : 'bg-white/95 text-gray-900 hover:bg-white'}`}>
                {showClean ? <><Sparkles size={20} /> Vision Propre Active</> : <><Zap size={20} className="text-emerald-500" /> Révéler le Futur</>}
              </button>
            </div>
            <div className="p-10 bg-blue-50/50 rounded-[3rem] border-2 border-blue-100 italic font-medium text-blue-900 text-base leading-relaxed shadow-sm">"{analysis?.insight || "La propreté est notre dignité commune."}"</div>
          </div>
          <div className="bg-white p-12 md:p-16 rounded-[4.5rem] shadow-sm space-y-12 flex flex-col border border-gray-100 relative">
            <div className="absolute top-10 right-10"><div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner"><ShieldCheck size={32} /></div></div>
            <div><label className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.3em] mb-3 block opacity-60">Nature de l'Anomalie</label><input value={analysis?.nature} onChange={(e) => setAnalysis({...analysis, nature: e.target.value})} className="text-4xl font-serif font-bold text-gray-900 bg-transparent outline-none w-full border-b-2 border-emerald-100 pb-3 focus:border-emerald-500 transition-all" /></div>
            <div className="grid grid-cols-2 gap-6">
              <div><label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Ville</label><input value={analysis?.city} onChange={(e) => setAnalysis({...analysis, city: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-gray-100 focus:border-emerald-500 focus:bg-white transition-all" /></div>
              <div><label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Quartier</label><input value={analysis?.sector} onChange={(e) => setAnalysis({...analysis, sector: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-gray-100 focus:border-emerald-500 focus:bg-white transition-all" /></div>
            </div>
            <div className="space-y-8"><h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-4"><FileText size={18} className="text-emerald-500"/> Plan d'Action</h4><div className="space-y-4">{analysis?.actionPlan?.map((step: string, i: number) => (<div key={i} className="flex gap-6 items-center bg-gray-50/50 p-6 rounded-3xl border border-gray-100 text-[15px] font-bold text-gray-800"><span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black shrink-0">{i+1}</span><input value={step} onChange={(e) => { const newPlan = [...analysis.actionPlan]; newPlan[i] = e.target.value; setAnalysis({...analysis, actionPlan: newPlan}); }} className="bg-transparent outline-none w-full" /></div>))}</div></div>
            <div className="pt-10 mt-auto"><button onClick={handlePublish} disabled={loading} className="w-full bg-gray-950 text-white py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.35em] flex items-center justify-center gap-5 hover:bg-black transition-all shadow-3xl disabled:opacity-50">{loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={28} className="text-emerald-400" />} Sceller et Diffuser l'Onde</button></div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
         <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-8 shadow-2xl shadow-emerald-50 animate-bounce"><CheckCircle2 size={64} /></div>
         <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Signalement Scellé</h2>
         <p className="text-gray-500 max-w-sm mx-auto text-lg mb-12">Votre onde souveraine a été diffusée et l'empreinte territoriale est désormais visible par tous.</p>
         <button onClick={() => { setView('hub'); fetchMyReports(); }} className="px-12 py-6 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl">Retour aux Archives</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 bg-[#fcfcfc] min-h-screen text-gray-900">
      <div className="mb-12">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all group p-2"><ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" /> Retour à l'Agora</button>
      </div>
      {editingReport && (
        <div className="fixed inset-0 z-[300] bg-gray-950/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-12 animate-in zoom-in">
              <h3 className="text-3xl font-serif font-bold mb-10">Rectifier</h3>
              <div className="space-y-5 mb-10">
                <input value={editingReport.city} onChange={e => setEditingReport({...editingReport, city: e.target.value})} className="w-full bg-gray-50 p-6 rounded-3xl font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="Ville" />
                <input value={editingReport.sector} onChange={e => setEditingReport({...editingReport, sector: e.target.value})} className="w-full bg-gray-50 p-6 rounded-3xl font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner" placeholder="Quartier" />
              </div>
              <button onClick={handleUpdateReport} disabled={editLoading} className="w-full bg-gray-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Sauvegarder</button>
           </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 mb-24">
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-8xl font-serif font-bold mb-8 tracking-tighter leading-tight">Sentinelle <span className="text-emerald-500 italic">Verte</span></h1>
          <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border mb-6 transition-all ${location ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
            <Locate size={14} className={location ? '' : 'animate-pulse'} />
            <span className="text-[10px] font-black uppercase tracking-widest">{location ? `GPS Prêt (${Math.round(location.accuracy || 0)}m)` : 'Acquisition GPS automatique...'}</span>
          </div>
          <p className="text-gray-500 text-xl md:text-2xl font-medium leading-relaxed">Détectez les nuisances, générez des plans d'action et archivez vos ondes sur le territoire.</p>
        </div>
        <button onClick={() => setView('instructions')} className="w-full lg:w-auto px-16 py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.3em] shadow-3xl flex items-center justify-center gap-6 hover:bg-emerald-700 transition-all"><Camera size={32} /> Scanner l'Anomalie</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
         <div className="lg:col-span-2 space-y-16">
            <h3 className="text-4xl font-serif font-bold flex items-center gap-6 tracking-tight"><History className="text-gray-300" size={32} /> Vos Signalements Archivés</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-[4rem] overflow-hidden shadow-sm hover:shadow-3xl transition-all duration-500 group flex flex-col relative">
                    <div className="h-72 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                       <button onClick={() => setEditingReport(r)} className="absolute top-8 right-8 w-14 h-14 bg-white/95 backdrop-blur-md text-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl hover:bg-white transition-all transform hover:rotate-12"><Pencil size={24} /></button>
                    </div>
                    <div className="p-10">
                       <div className="flex items-center gap-3 mb-2"><MapPin size={14} className="text-blue-500" /><p className="text-[11px] font-black uppercase text-blue-500 tracking-[0.25em]">{r.sector}</p></div>
                       <h4 className="font-serif font-bold text-3xl text-gray-900 mb-4">{r.city}</h4>
                       <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed font-medium mb-8">"{r.description}"</p>
                       <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">Scellé</span>
                          {r.latitude && <Locate size={12} className="text-emerald-400" />}
                       </div>
                    </div>
                  </div>
              )) : (
                <div className="col-span-full py-48 text-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[4rem] flex flex-col items-center"><div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm"><Scan className="text-gray-200" size={48} /></div><p className="text-gray-400 font-black uppercase text-[12px] tracking-[0.4em]">Aucun signalement scellé.</p></div>
              )}
            </div>
         </div>
         <aside className="space-y-12">
            <div className="bg-gray-950 text-white p-14 rounded-[4.5rem] shadow-4xl relative overflow-hidden group border border-white/5">
               <h3 className="font-serif font-bold text-3xl mb-8 flex items-center gap-5 text-emerald-400"><Info size={32} /> Guide Citoyen</h3>
               <p className="text-gray-400 leading-relaxed font-medium">Chaque anomalie capturée est une donnée qui permet de bâtir un plan d'action certifié. La position GPS automatique garantit la véracité de votre engagement sur le territoire.</p>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default SentinelPage;
