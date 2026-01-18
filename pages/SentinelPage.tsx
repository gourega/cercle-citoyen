
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
  Focus,
  Scan,
  History,
  Layers,
  AlertTriangle
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
  const [simulatedDepth, setSimulatedDepth] = useState("F/1.8");
  const [isFlashing, setIsFlashing] = useState(false);
  
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

  useEffect(() => {
    if (view === 'camera') {
      const interval = setInterval(() => {
        const d = (Math.random() * 2 + 1.5).toFixed(1);
        setSimulatedDistance(`${d}m`);
        const f = (Math.random() * 0.4 + 1.6).toFixed(1);
        setSimulatedDepth(`F/${f}`);
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
        console.warn("Table manquante, mode mock.");
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
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera Error:", e);
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
        
        setTimeout(() => {
          setIsFlashing(false);
          stopCamera();
          processImage(data);
        }, 200);
      }
    }
  };

  const processImage = async (img: string) => {
    setView('processing');
    try {
      const analysisPromise = analyzePollutionImage(img);
      const visionPromise = generateCleanVision(img).catch(() => null);

      const [res, clean] = await Promise.all([analysisPromise, visionPromise]);
      
      if (!res) {
        // Fallback Manuel si l'IA échoue
        setAnalysis({
          city: "Localité à préciser",
          sector: "Secteur à identifier",
          nature: "Inconnue (Analyse IA échouée)",
          status: "reported",
          description: "L'IA n'a pas pu identifier la nuisance automatiquement. Veuillez remplir manuellement.",
          actionPlan: ["Identifier la source", "Sécuriser le lieu", "Alerter les services d'hygiène"],
          insight: "Même quand l'IA doute, la vigilance citoyenne reste le premier rempart."
        });
        setCleanVision(null);
        addToast("L'IA a eu un doute. Complétez le rapport manuellement.", "info");
      } else {
        setAnalysis({
          ...res,
          actionPlan: res.actionPlan || ["Sécuriser la zone", "Organiser le ramassage", "Sensibiliser le voisinage"]
        });
        setCleanVision(clean);
      }
      setView('result');
    } catch (e: any) {
      console.error("Processing error:", e);
      addToast("Erreur lors du traitement. Réessayez.", "error");
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
          content: `🚨 [SENTINELLE VERTE] ${analysis.nature} identifiée à ${analysis.city}. Vision Citoyenne Propre disponible ! ✨ "${analysis.insight}"`,
          image_url: capturedImage,
          clean_vision_url: cleanVision,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);
      }
      addToast("Signalement archivé et diffusé !", "success");
      setView('success');
    } catch (err: any) {
      addToast("Erreur lors de l'archivage", "error");
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
        addToast("Localisation rectifiée !", "success");
      }
      setEditingReport(null);
      fetchMyReports();
    } catch (e) {
      addToast("Erreur technique", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // --- VUES ---

  if (view === 'instructions') {
    return (
      <div className="fixed inset-0 z-[300] bg-gray-950/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-500">
           <div className="bg-emerald-600 p-10 text-white relative">
              <button onClick={() => setView('hub')} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all p-2"><X size={28} /></button>
              <ShieldCheck size={56} className="mb-6" />
              <h2 className="text-4xl font-serif font-bold leading-tight">Protocole<br/>Sentinelle</h2>
              <p className="text-emerald-100 text-[10px] mt-2 uppercase tracking-[0.3em] font-black opacity-80">Souveraineté Territoriale Active</p>
           </div>
           <div className="p-10 space-y-8">
              <div className="space-y-6">
                 {[
                   { icon: <Camera size={22} />, title: "Capture de l'Anomalie", desc: "Visez la nuisance (caniveau, ordures, eaux usées). L'IA détecte les contours même de près." },
                   { icon: <Scan size={22} />, title: "Scan de Précision", desc: "Le système analyse la nature chimique et urbaine du signalement." },
                   { icon: <Zap size={22} />, title: "Vision Propre", desc: "Générez un visuel haute fidélité du lieu réhabilité pour inspirer l'action." }
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
              <button 
                onClick={startCamera} 
                className="w-full mt-10 bg-gray-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95"
              >
                Lancer le Scrutateur <ArrowRight size={20} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[500] bg-black flex flex-col overflow-hidden">
        {/* Vidéo de fond */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-1000" 
        />
        
        {/* Effet Flash */}
        <div className={`absolute inset-0 bg-white z-[600] pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* HUD UI - Futuriste & Surélevée */}
        <div className="absolute inset-0 z-[510] pointer-events-none flex flex-col justify-between p-8 md:p-12 select-none">
          
          {/* Header HUD */}
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col gap-3">
              <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-emerald-500/50 flex items-center gap-4 shadow-2xl">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Distance : <span className="text-white font-mono text-base ml-2">{simulatedDistance}</span></span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-3 w-fit">
                 <Layers size={12} className="text-blue-400" />
                 <span className="text-[9px] font-black text-white uppercase tracking-widest">Focus : {simulatedDepth}</span>
              </div>
            </div>
            <button 
              onClick={() => { stopCamera(); setView('hub'); }} 
              className="p-5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10 pointer-events-auto"
            >
              <X size={24} />
            </button>
          </div>

          {/* Réticule de visée Central */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 flex items-center justify-center">
            <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-blue-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399]"></div>
            
            {/* Coins du réticule */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-emerald-400 rounded-tl-2xl shadow-[-4px_-4px_10px_rgba(52,211,153,0.3)]"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-400 rounded-tr-2xl shadow-[4px_-4px_10px_rgba(52,211,153,0.3)]"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-emerald-400 rounded-bl-2xl shadow-[-4px_4px_10px_rgba(52,211,153,0.3)]"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-emerald-400 rounded-br-2xl shadow-[4px_-4px_10px_rgba(52,211,153,0.3)]"></div>
            
            {/* Animation de scan latérale */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent w-1 h-full animate-[scanline_2s_ease-in-out_infinite] left-0"></div>
          </div>

          {/* Stats HUD Bas Gauche */}
          <div className="flex flex-col gap-6 items-start mb-24 md:mb-12">
             <div className="space-y-1 bg-black/30 p-3 rounded-xl border-l-2 border-emerald-500">
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Capteur Souverain</p>
                <p className="text-xs text-white font-mono font-bold">SENTINELLE-X{user.id.slice(0,4)}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Localisation</p>
                <p className="text-[10px] text-white font-mono">{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'ACQUISITION...'}</p>
             </div>
          </div>

          {/* Contrôles HUD Droite (Slider Zoom) */}
          <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 h-80 flex flex-col items-center gap-4 pointer-events-auto">
             <div className="flex-1 w-1.5 bg-white/10 rounded-full relative overflow-hidden shadow-inner">
                <div className="absolute bottom-0 inset-x-0 bg-emerald-500/60" style={{ height: `${zoom * 20}%` }}></div>
                <input 
                  type="range" 
                  min="1" max="5" step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="absolute inset-y-0 w-full opacity-0 cursor-pointer -rotate-180" 
                  style={{ appearance: 'slider-vertical' as any }}
                />
                <div className="absolute w-8 h-8 bg-white rounded-full -left-[13px] border-4 border-emerald-500 shadow-2xl transition-all flex items-center justify-center" style={{ bottom: `${(zoom - 1) * 25}%` }}>
                   <Maximize size={12} className="text-emerald-600" />
                </div>
             </div>
             <Focus className="text-emerald-400" size={20} />
             <span className="text-[8px] text-white font-black uppercase tracking-widest rotate-90 mt-4 whitespace-nowrap opacity-60">OPTICAL DEPTH</span>
          </div>
        </div>

        {/* Bouton de Capture (Bas) */}
        <div className="absolute bottom-16 inset-x-0 z-[520] flex justify-center items-center gap-12 md:gap-20">
           <button onClick={() => setZoom(1)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 pointer-events-auto hover:bg-white/10 transition-all"><RotateCcw size={24}/></button>
           
           <button 
            onClick={capturePhoto} 
            className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-[10px] border-white/20 active:scale-95 transition-all shadow-[0_0_50px_rgba(16,185,129,0.4)] group pointer-events-auto"
           >
              <div className="w-18 h-18 bg-emerald-500 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                 <Camera className="text-white" size={42} />
              </div>
           </button>
           
           <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 pointer-events-auto hover:bg-white/10 transition-all"><Maximize size={24}/></button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <style>{`
          @keyframes scanline { 0% { left: 0%; opacity: 0; } 50% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
        `}</style>
      </div>
    );
  }

  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-8 text-center text-gray-900">
        <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-[12px] border-white shadow-3xl mb-16 group">
          <img src={capturedImage!} className="w-full h-full object-cover opacity-60 blur-sm scale-110 transition-all duration-[3000ms]" alt="Process" />
          <div className="absolute inset-x-0 top-0 h-2 bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,1)] animate-[scan_2.5s_ease-in-out_infinite] z-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent flex items-end p-10">
             <div className="w-full space-y-4">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-emerald-400 shadow-[0_0_15px_#34d399] animate-[progress_4s_ease-in-out_infinite]"></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-white font-black uppercase tracking-[0.2em]">
                   <span>Analyse Neurale</span>
                   <span className="animate-pulse">Calcul...</span>
                </div>
             </div>
          </div>
        </div>
        <h2 className="text-4xl font-serif font-bold mb-6 flex items-center gap-5 justify-center text-gray-950">
          <Sparkles className="text-emerald-500 animate-pulse" size={32} /> Intelligence en Action
        </h2>
        <p className="text-gray-400 max-w-sm mx-auto text-[12px] font-black uppercase tracking-[0.25em] leading-relaxed">
          Le Gardien décrypte les données territoriales et tisse la Vision Propre...
        </p>
        <style>{`
          @keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
          @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        `}</style>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-in fade-in duration-700 text-gray-900 bg-[#fcfcfc] min-h-screen">
        <div className="flex justify-between items-center mb-12">
          <button onClick={() => setView('hub')} className="flex items-center gap-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all group p-2">
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" /> Abandonner le signalement
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-10">
            <div className="relative rounded-[4rem] overflow-hidden shadow-3xl border-[16px] border-white aspect-square bg-gray-100 group">
              <img 
                src={showClean ? (cleanVision || capturedImage!) : capturedImage!} 
                className="w-full h-full object-cover transition-all duration-1000 ease-in-out" 
                alt="Résultat" 
              />
              <button 
                onClick={() => setShowClean(!showClean)} 
                className={`absolute bottom-10 inset-x-10 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-5 active:scale-95 ${
                  showClean ? 'bg-emerald-600 text-white' : 'bg-white/95 text-gray-900 hover:bg-white'
                }`}
              >
                {showClean ? <><Sparkles size={20} /> Vision Propre Active</> : <><Zap size={20} className="text-emerald-500" /> Révéler le Futur Propre</>}
              </button>
              {showClean && !cleanVision && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-500">
                   <div className="text-center space-y-4">
                      <Loader2 size={40} className="text-white animate-spin mx-auto" />
                      <p className="text-white text-[10px] font-black uppercase tracking-widest">Génération en cours...</p>
                   </div>
                </div>
              )}
            </div>
            <div className="p-10 bg-blue-50/50 rounded-[3rem] border-2 border-blue-100 italic font-medium text-blue-900 text-base leading-relaxed shadow-sm">
              "{analysis?.insight || "La propreté est le premier visage de notre dignité commune."}"
            </div>
          </div>

          <div className="bg-white p-12 md:p-16 rounded-[4.5rem] shadow-sm space-y-12 flex flex-col border border-gray-100 relative">
            <div className="absolute top-10 right-10">
               <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                  <ShieldCheck size={32} />
               </div>
            </div>

            {analysis?.nature?.includes("Inconnue") && (
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4 text-amber-800 text-xs font-bold animate-in slide-in-from-top-2">
                <AlertTriangle className="shrink-0 text-amber-500" size={20} />
                <p>L'IA n'a pas pu identifier automatiquement la nuisance. Vous pouvez modifier les champs ci-dessous avant de publier.</p>
              </div>
            )}

            <div>
              <label className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.3em] mb-3 block opacity-60">Nature de l'Anomalie</label>
              <input 
                value={analysis?.nature} 
                onChange={(e) => setAnalysis({...analysis, nature: e.target.value})} 
                placeholder="Ex: Caniveau bouché, décharge sauvage..."
                className="text-4xl font-serif font-bold text-gray-950 bg-transparent outline-none w-full border-b-2 border-emerald-100 pb-3 focus:border-emerald-500 transition-all" 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Ville</label>
                <input 
                  value={analysis?.city} 
                  onChange={(e) => setAnalysis({...analysis, city: e.target.value})} 
                  className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-gray-100 focus:border-emerald-500 focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Quartier</label>
                <input 
                  value={analysis?.sector} 
                  onChange={(e) => setAnalysis({...analysis, sector: e.target.value})} 
                  className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-gray-100 focus:border-emerald-500 focus:bg-white transition-all" 
                />
              </div>
            </div>
            
            <div className="space-y-8">
               <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-4">
                 <FileText size={18} className="text-emerald-500"/> Plan d'Action Souverain
               </h4>
               <div className="space-y-4">
                 {analysis?.actionPlan?.map((step: string, i: number) => (
                   <div key={i} className="flex gap-6 items-center bg-gray-50/50 p-6 rounded-3xl border border-gray-100 text-[15px] font-bold text-gray-800 group hover:bg-white hover:shadow-xl transition-all cursor-default">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black shrink-0 group-hover:scale-110 transition-transform shadow-sm">{i+1}</span>
                      <input 
                        value={step}
                        onChange={(e) => {
                          const newPlan = [...analysis.actionPlan];
                          newPlan[i] = e.target.value;
                          setAnalysis({...analysis, actionPlan: newPlan});
                        }}
                        className="bg-transparent outline-none w-full"
                      />
                   </div>
                 ))}
               </div>
            </div>

            <div className="pt-10 mt-auto">
              <button 
                onClick={handlePublish} 
                disabled={loading} 
                className="w-full bg-gray-950 text-white py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.35em] flex items-center justify-center gap-5 hover:bg-black transition-all shadow-3xl active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={28} className="text-emerald-400" />} Sceller et Diffuser l'Onde
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HUB PRINCIPAL
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 bg-[#fcfcfc] min-h-screen text-gray-900">
      <div className="mb-12">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all group p-2">
          <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" /> Retour à l'Agora
        </button>
      </div>

      {editingReport && (
        <div className="fixed inset-0 z-[300] bg-gray-950/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-12 animate-in zoom-in">
              <h3 className="text-3xl font-serif font-bold mb-10">Rectifier la position</h3>
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
          <p className="text-gray-500 text-xl md:text-2xl font-medium leading-relaxed">
            Veillez sur votre territoire. Détectez les nuisances, générez des plans d'action et partagez la vision d'une cité propre.
          </p>
        </div>
        <button 
          onClick={() => setView('instructions')} 
          className="w-full lg:w-auto px-16 py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.3em] shadow-3xl shadow-emerald-200/60 flex items-center justify-center gap-6 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
        >
          <Camera size={32} /> Scanner l'Anomalie
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
         <div className="lg:col-span-2 space-y-16">
            <h3 className="text-4xl font-serif font-bold flex items-center gap-6 tracking-tight">
              <History className="text-gray-300" size={32} /> Vos Signalements Archivés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-[4rem] overflow-hidden shadow-sm hover:shadow-3xl transition-all duration-500 group flex flex-col relative">
                    <div className="h-72 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <button onClick={() => setEditingReport(r)} className="absolute top-8 right-8 w-14 h-14 bg-white/95 backdrop-blur-md text-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl hover:bg-white transition-all transform hover:rotate-12 pointer-events-auto">
                         <Pencil size={24} />
                       </button>
                    </div>
                    <div className="p-10">
                       <div className="flex items-center gap-3 mb-2">
                          <MapPin size={14} className="text-blue-500" />
                          <p className="text-[11px] font-black uppercase text-blue-500 tracking-[0.25em]">{r.sector}</p>
                       </div>
                       <h4 className="font-serif font-bold text-3xl text-gray-950 mb-4">{r.city}</h4>
                       <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed font-medium mb-8">"{r.description}"</p>
                       <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">Scellé</span>
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-mono">#{r.id.slice(0,8)}</span>
                       </div>
                    </div>
                  </div>
              )) : (
                <div className="col-span-full py-48 text-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[4rem] flex flex-col items-center shadow-inner">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
                    <Scan className="text-gray-200" size={48} />
                  </div>
                  <p className="text-gray-400 font-black uppercase text-[12px] tracking-[0.4em]">Aucun signalement scellé.</p>
                </div>
              )}
            </div>
         </div>

         <aside className="space-y-12">
            <div className="bg-gray-950 text-white p-14 rounded-[4.5rem] shadow-4xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000"><ShieldCheck size={180} /></div>
               <h3 className="font-serif font-bold text-3xl mb-8 flex items-center gap-5 text-emerald-400"><Info size={32} /> Guide Citoyen</h3>
               <div className="space-y-8 relative z-10">
                 <p className="text-lg text-gray-400 leading-relaxed font-medium italic border-l-4 border-emerald-500/30 pl-6">
                   "Chaque anomalie capturée est une donnée souveraine qui permet de bâtir un plan d'action certifié."
                 </p>
                 <div className="w-20 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                 <p className="text-base text-gray-300 leading-relaxed font-medium">
                   Votre action directe est le premier levier. Une fois le signalement scellé, il est partagé pour déclencher une Quête de nettoyage collective.
                 </p>
               </div>
            </div>
            
            <div className="p-12 bg-emerald-50/30 rounded-[3.5rem] border border-emerald-100 shadow-sm flex flex-col items-center text-center group hover:bg-emerald-50 transition-all duration-500">
               <Target size={44} className="text-emerald-600 mb-6 group-hover:scale-110 transition-transform" />
               <h4 className="font-black text-emerald-950 text-[11px] uppercase tracking-[0.4em] mb-3">Objectif 2030</h4>
               <p className="text-sm text-emerald-800 font-bold leading-relaxed">Zéro décharge sauvage grâce à la vigilance souveraine.</p>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default SentinelPage;
