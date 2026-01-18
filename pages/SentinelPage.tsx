
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
  // Fix: Add missing History icon import from lucide-react to avoid conflict with global History interface
  History
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
      }, 1200);
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
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera Error:", e);
      addToast("Caméra inaccessible", "error");
      setView('hub');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      // Effet Flash
      setIsFlashing(true);
      
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(data);
        
        // Délai court pour le flash avant de changer de vue
        setTimeout(() => {
          setIsFlashing(false);
          stopCamera();
          processImage(data);
        }, 150);
      }
    }
  };

  const processImage = async (img: string) => {
    setView('processing');
    try {
      // On lance les deux analyses en parallèle
      const analysisPromise = analyzePollutionImage(img);
      const visionPromise = generateCleanVision(img).catch(() => null);

      const [res, clean] = await Promise.all([analysisPromise, visionPromise]);
      
      if (!res) throw new Error("Échec d'analyse.");
      
      setAnalysis({
        ...res,
        actionPlan: res.actionPlan || ["Identifier", "Nettoyer", "Prévenir"]
      });
      setCleanVision(clean);
      setView('result');
    } catch (e: any) {
      console.error("Processing error:", e);
      addToast("Analyse impossible. Réessayez.", "error");
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
      <div className="fixed inset-0 z-[300] bg-gray-950/80 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-500">
           <div className="bg-emerald-600 p-10 text-white relative">
              <button onClick={() => setView('hub')} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><X size={28} /></button>
              <ShieldCheck size={56} className="mb-6" />
              <h2 className="text-4xl font-serif font-bold leading-tight">Protocole<br/>Sentinelle</h2>
              <p className="text-emerald-100 text-[10px] mt-2 uppercase tracking-[0.3em] font-black opacity-80">Souveraineté Territoriale Active</p>
           </div>
           <div className="p-10 space-y-8">
              <div className="space-y-6">
                 {[
                   { icon: <Camera size={22} />, title: "Capture de l'Anomalie", desc: "Visez la nuisance (ordures, épaves, etc.). L'IA détecte les contours." },
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
                className="w-full mt-10 bg-gray-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4"
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
        <div className="absolute inset-0 z-[510] pointer-events-none flex flex-col justify-between p-8 md:p-12">
          
          {/* Header HUD */}
          <div className="flex justify-between items-start w-full">
            <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-emerald-500/50 flex items-center gap-4 shadow-2xl">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Distance : <span className="text-white font-mono text-base ml-2">{simulatedDistance}</span></span>
            </div>
            <button 
              onClick={() => { stopCamera(); setView('hub'); }} 
              className="p-5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10 pointer-events-auto"
            >
              <X size={24} />
            </button>
          </div>

          {/* Réticule de visée Central */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"></div>
            {/* Coins du réticule */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl shadow-[-4px_-4px_10px_rgba(52,211,153,0.3)]"></div>
            <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl shadow-[4px_-4px_10px_rgba(52,211,153,0.3)]"></div>
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl shadow-[-4px_4px_10px_rgba(52,211,153,0.3)]"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-emerald-400 rounded-br-xl shadow-[4px_4px_10px_rgba(52,211,153,0.3)]"></div>
          </div>

          {/* Stats HUD Gauche */}
          <div className="flex flex-col gap-8 items-start mb-24">
             <div className="space-y-1">
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Capteur</p>
                <p className="text-xs text-white font-mono font-bold">SENTINELLE-X{user.id.slice(0,4)}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Résolution</p>
                <p className="text-xs text-white font-mono font-bold">4K CITOYEN</p>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">GPS LOCK</p>
                <p className="text-[10px] text-emerald-400 font-mono italic">{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'RECHERCHE...'}</p>
             </div>
          </div>

          {/* Contrôles HUD Droite (Slider Zoom) */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 h-80 flex flex-col items-center gap-4 pointer-events-auto">
             <div className="flex-1 w-1 bg-white/10 rounded-full relative overflow-hidden">
                <div className="absolute bottom-0 inset-x-0 bg-emerald-500/40" style={{ height: `${zoom * 20}%` }}></div>
                <input 
                  type="range" 
                  min="1" max="5" step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="absolute inset-y-0 w-full opacity-0 cursor-pointer -rotate-180" 
                  style={{ appearance: 'slider-vertical' as any }}
                />
                <div className="absolute w-6 h-6 bg-white rounded-full -left-[10px] border-4 border-emerald-500 shadow-2xl transition-all" style={{ bottom: `${(zoom - 1) * 25}%` }}></div>
             </div>
             <Focus className="text-emerald-400" size={20} />
             <span className="text-[8px] text-white font-black uppercase tracking-widest rotate-90 mt-4 whitespace-nowrap">OPTICAL DEPTH</span>
          </div>
        </div>

        {/* Bouton de Capture (Bas) */}
        <div className="absolute bottom-16 inset-x-0 z-[520] flex justify-center items-center gap-16">
           <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40"><RotateCcw size={24}/></div>
           
           <button 
            onClick={capturePhoto} 
            className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-[10px] border-white/20 active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] group pointer-events-auto"
           >
              <div className="w-18 h-18 bg-emerald-500 rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
                 <Camera className="text-white" size={38} />
              </div>
           </button>
           
           <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40"><Maximize size={24}/></div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-8 text-center text-gray-900">
        <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-8 border-white shadow-3xl mb-16 group">
          <img src={capturedImage!} className="w-full h-full object-cover opacity-70 blur-sm group-hover:blur-0 transition-all duration-1000" alt="Process" />
          <div className="absolute inset-x-0 top-0 h-1.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] animate-[scan_2.5s_ease-in-out_infinite] z-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent flex items-end p-8">
             <div className="w-full space-y-2">
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 animate-[progress_3s_ease-in-out_infinite]"></div>
                </div>
                <p className="text-[10px] text-white font-black uppercase tracking-widest">Décryptage des nuages de points...</p>
             </div>
          </div>
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4 flex items-center gap-4 justify-center text-gray-950">
          <Sparkles className="text-emerald-500 animate-pulse" size={28} /> Intelligence en Action
        </h2>
        <p className="text-gray-400 max-w-xs mx-auto text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">
          Le Gardien génère la Vision Propre et le protocole de salubrité territoriale...
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
          <button onClick={() => setView('hub')} className="flex items-center gap-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all">
            <ChevronLeft size={20}/> Abandonner le signalement
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="relative rounded-[4rem] overflow-hidden shadow-3xl border-8 border-white aspect-square bg-gray-50 group">
              <img 
                src={showClean ? (cleanVision || capturedImage!) : capturedImage!} 
                className="w-full h-full object-cover transition-all duration-700 ease-in-out" 
                alt="Résultat" 
              />
              <button 
                onClick={() => setShowClean(!showClean)} 
                className={`absolute bottom-10 inset-x-10 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 ${
                  showClean ? 'bg-emerald-600 text-white' : 'bg-white/95 text-gray-900 hover:bg-white'
                }`}
              >
                {showClean ? <><Sparkles size={18} /> Vision Propre Active</> : <><Zap size={18} className="text-emerald-500" /> Révéler le Futur Propre</>}
              </button>
              {showClean && !cleanVision && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 p-4 rounded-xl text-white text-[10px] font-black uppercase">Génération en cours...</div>
              )}
            </div>
            <div className="p-8 bg-blue-50/50 rounded-[3rem] border border-blue-100 italic font-medium text-blue-900 text-sm leading-relaxed">
              "{analysis?.insight || "La propreté est le premier visage de notre dignité commune."}"
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-sm space-y-10 flex flex-col border border-gray-100">
            <div>
              <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2 block">Nature de l'Anomalie</label>
              <input 
                value={analysis?.nature} 
                onChange={(e) => setAnalysis({...analysis, nature: e.target.value})} 
                className="text-3xl font-serif font-bold text-gray-950 bg-transparent outline-none w-full border-b-2 border-emerald-100 pb-2 focus:border-emerald-500 transition-all" 
              />
            </div>
            
            <div className="space-y-6">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-3">
                 <FileText size={16} className="text-emerald-500"/> Plan d'Action Recommandé
               </h4>
               <div className="space-y-3">
                 {analysis?.actionPlan?.map((step: string, i: number) => (
                   <div key={i} className="flex gap-5 items-center bg-gray-50/80 p-5 rounded-2xl border border-gray-100 text-[14px] font-bold text-gray-800 group hover:bg-white hover:shadow-md transition-all">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0 group-hover:scale-110 transition-transform">{i+1}</span>
                      {step}
                   </div>
                 ))}
               </div>
            </div>

            <div className="pt-8 mt-auto">
              <button 
                onClick={handlePublish} 
                disabled={loading} 
                className="w-full bg-gray-950 text-white py-7 rounded-3xl font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-2xl disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} className="text-emerald-400" />} Sceller et Diffuser
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
        <button onClick={() => navigate('/feed')} className="flex items-center gap-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Retour à l'Agora
        </button>
      </div>

      {editingReport && (
        <div className="fixed inset-0 z-[300] bg-gray-950/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-3xl p-10 animate-in zoom-in">
              <h3 className="text-2xl font-serif font-bold mb-8">Rectifier la position</h3>
              <div className="space-y-4 mb-8">
                <input value={editingReport.city} onChange={e => setEditingReport({...editingReport, city: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all" placeholder="Ville" />
                <input value={editingReport.sector} onChange={e => setEditingReport({...editingReport, sector: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all" placeholder="Quartier" />
              </div>
              <button onClick={handleUpdateReport} disabled={editLoading} className="w-full bg-gray-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl">Sauvegarder les modifications</button>
           </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 mb-24">
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight">Sentinelle <span className="text-emerald-500 italic">Verte</span></h1>
          <p className="text-gray-500 text-xl font-medium leading-relaxed">
            Veillez sur votre territoire. Détectez les nuisances, générez des plans d'action et partagez la vision d'une cité propre.
          </p>
        </div>
        <button 
          onClick={() => setView('instructions')} 
          className="w-full lg:w-auto px-12 py-7 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-3xl shadow-emerald-200/50 flex items-center justify-center gap-5 hover:bg-emerald-700 transition-all hover:scale-105"
        >
          <Camera size={28} /> Scanner l'Anomalie
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
         <div className="lg:col-span-2 space-y-12">
            <h3 className="text-3xl font-serif font-bold flex items-center gap-5">
              {/* Fix: Use History icon from lucide-react instead of global History constructor */}
              <History className="text-gray-300" /> Vos Signalements Archivés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col">
                    <div className="h-64 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <button onClick={() => setEditingReport(r)} className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-md text-emerald-600 rounded-2xl flex items-center justify-center shadow-xl hover:bg-white transition-all transform hover:rotate-12">
                         <Pencil size={20} />
                       </button>
                    </div>
                    <div className="p-8">
                       <h4 className="font-serif font-bold text-2xl text-gray-950 mb-1">{r.city}</h4>
                       <div className="flex items-center gap-2 mb-4">
                         <MapPin size={12} className="text-blue-500" />
                         <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">{r.sector}</p>
                       </div>
                       <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed font-medium mb-6">"{r.description}"</p>
                       <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">Archivé</span>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest font-mono">#{r.id.slice(0,8)}</span>
                       </div>
                    </div>
                  </div>
              )) : (
                <div className="col-span-full py-40 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-[4rem] flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Scan className="text-gray-200" size={40} />
                  </div>
                  <p className="text-gray-400 font-black uppercase text-[11px] tracking-[0.3em]">Aucun signalement scellé sur ce profil.</p>
                </div>
              )}
            </div>
         </div>

         <aside className="space-y-10">
            <div className="bg-gray-950 text-white p-12 rounded-[4rem] shadow-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform"><ShieldCheck size={100} /></div>
               <h3 className="font-serif font-bold text-3xl mb-6 flex items-center gap-4"><Info size={28} className="text-emerald-500" /> Guide Citoyen</h3>
               <div className="space-y-6">
                 <p className="text-base text-gray-400 leading-relaxed font-medium italic">
                   "Chaque anomalie capturée est une donnée souveraine qui permet de bâtir un plan d'action certifié par l'intelligence du Cercle."
                 </p>
                 <div className="w-12 h-1 bg-emerald-500"></div>
                 <p className="text-sm text-gray-300 leading-relaxed">
                   Votre action directe est le premier levier de changement. Une fois le signalement scellé, il est partagé avec la communauté et les institutions partenaires pour déclencher une Quête de nettoyage.
                 </p>
               </div>
            </div>
            
            <div className="p-10 bg-emerald-50/50 rounded-[3rem] border border-emerald-100 shadow-sm flex flex-col items-center text-center">
               <Target size={32} className="text-emerald-600 mb-4" />
               <h4 className="font-bold text-emerald-950 text-sm uppercase tracking-widest mb-2">Objectif National</h4>
               <p className="text-xs text-emerald-800 font-medium">Zéro décharge sauvage d'ici 2030 grâce à la vigilance souveraine.</p>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default SentinelPage;
