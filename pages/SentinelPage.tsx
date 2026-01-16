
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
  LogOut
} from 'lucide-react';
import { User, WasteReport, CircleType } from '../types.ts';
import { analyzePollutionImage, generateCleanVision } from '../lib/gemini.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { useToast } from '../ToastContext.tsx';

const SentinelPage: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [view, setView] = useState<'hub' | 'camera' | 'processing' | 'result' | 'success'>('hub');
  
  // États de données (Verrouillés)
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cleanVision, setCleanVision] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [showClean, setShowClean] = useState(false);
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
        console.warn("Utilisation du stockage local temporaire.");
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
      addToast("Caméra indisponible.", "error");
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
        actionPlan: res.actionPlan || ["Sécuriser la zone", "Informer les autorités", "Suivre la résolution"]
      });
      setCleanVision(clean);
      setView('result');
    } catch (e: any) {
      addToast("L'analyse IA a rencontré un obstacle.", "error");
      setView('hub');
    }
  };

  const handlePublish = async () => {
    if (!analysis || !capturedImage || loading) return;
    
    // Vérification des champs requis
    if ((analysis.city || "").toLowerCase().includes('à préciser') || 
        (analysis.sector || "").toLowerCase().includes('à préciser')) {
      addToast("Veuillez préciser la Ville et le Secteur.", "info");
      return;
    }

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
        const { error: reportError } = await supabase.from('waste_reports').insert([reportData]);
        if (reportError) throw reportError;

        await supabase.from('posts').insert([{
          author_id: user.id,
          circle_type: CircleType.URBAN,
          content: `🚨 [SENTINELLE] ${analysis.nature} à ${analysis.city}. Vision Propre disponible ! ✨ ${analysis.insight}`,
          image_url: capturedImage,
          clean_vision_url: cleanVision,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);
      } else {
        // Simulation locale si Supabase est absent
        setReports(prev => [{ ...reportData, id: 'demo-' + Date.now(), timestamp: new Date().toISOString() } as any, ...prev]);
      }
      
      addToast("Signalement et Plan archivés !", "success");
      setView('success');
    } catch (err: any) {
      console.error("Erreur publication:", err);
      addToast("Publication impossible (Erreur Serveur).", "error");
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
        addToast("Correction enregistrée.", "success");
      }
      setEditingReport(null);
      fetchMyReports();
    } catch (e) {
      addToast("Erreur lors de la rectification.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
         <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-10 text-emerald-500 shadow-2xl">
            <CheckCircle2 size={64} className="animate-bounce" />
         </div>
         <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4 text-center">Plan d'Intervention Scellé</h2>
         <p className="text-gray-500 text-center max-w-sm mb-12 font-medium">Votre signalement a été certifié par le système Sentinelle. L'autorité compétente a été notifiée.</p>
         
         <div className="w-full max-w-sm bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 mb-10">
            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest text-center">Détails de Mission</h4>
            <div className="space-y-3">
               <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Nature</span>
                  <span className="font-bold text-gray-900">{analysis?.nature}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Localisation</span>
                  <span className="font-bold text-gray-900">{analysis?.city}</span>
               </div>
            </div>
         </div>

         <button 
          onClick={() => { fetchMyReports(); setView('hub'); }}
          className="bg-gray-900 text-white px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"
         >
           Retour au Hub Sentinelle
         </button>
      </div>
    );
  }

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover" />
        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/30 rounded-[3rem]"></div>
        </div>
        <div className="absolute top-8 left-8">
           <button onClick={() => { stopCamera(); setView('hub'); }} className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white"><X size={24} /></button>
        </div>
        <div className="absolute bottom-12 inset-x-0 flex justify-center gap-10 items-center">
           <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-[8px] border-white/20 active:scale-90 transition-all">
             <div className="w-16 h-16 bg-emerald-500 rounded-full shadow-2xl"></div>
           </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (view === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-4 border-white/10 mb-12">
          <img src={capturedImage!} className="w-full h-full object-cover opacity-50" alt="Process" />
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4 flex items-center gap-3 justify-center"><Sparkles className="text-emerald-400" /> Analyse IA...</h2>
        <p className="text-gray-400 max-w-xs mx-auto animate-pulse uppercase text-[10px] font-black tracking-widest">Calcul de la Vision Propre et du Plan d'Action</p>
        <style>{`@keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }`}</style>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setView('hub')} className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors">
            <ChevronLeft size={16}/> Annuler
          </button>
          <div className="flex gap-4">
             <button onClick={startCamera} className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all">
                <RotateCcw size={16}/> Recommencer
             </button>
             <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 px-4 py-2 rounded-xl transition-all">
                <LogOut size={16}/> Quitter
             </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="relative rounded-[4rem] overflow-hidden shadow-3xl border-8 border-white aspect-square bg-gray-900">
              <img src={showClean ? cleanVision || capturedImage! : capturedImage!} className="w-full h-full object-cover transition-all duration-700" alt="Capture" />
              <div className="absolute bottom-10 inset-x-0 flex justify-center">
                 <button onClick={() => setShowClean(!showClean)} className={`px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl transition-all ${showClean ? 'bg-emerald-500 text-white' : 'bg-white/90 text-gray-900 backdrop-blur-md'}`}>
                  {showClean ? <CheckCircle size={16}/> : <Sparkles size={16}/>}
                  {showClean ? 'Vision Propre Active' : 'Voir le Futur Propre'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 md:p-12 rounded-[4rem] shadow-sm space-y-8 flex flex-col">
            <div className="space-y-6">
              <div className="relative group">
                <input 
                  value={analysis?.nature}
                  onChange={(e) => setAnalysis({...analysis, nature: e.target.value})}
                  className="text-3xl font-serif font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-emerald-100 outline-none w-full"
                />
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-300" />
                    <input 
                      value={analysis?.city}
                      onChange={(e) => setAnalysis({...analysis, city: e.target.value})}
                      placeholder="Ville"
                      className="text-xs font-bold uppercase tracking-widest bg-transparent border-b border-transparent focus:border-emerald-100 outline-none w-full text-gray-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation size={14} className="text-gray-300" />
                    <input 
                      value={analysis?.sector}
                      onChange={(e) => setAnalysis({...analysis, sector: e.target.value})}
                      placeholder="Secteur"
                      className="text-xs font-bold uppercase tracking-widest bg-transparent border-b border-transparent focus:border-emerald-100 outline-none w-full text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 flex items-center gap-2">
                 <FileText size={12}/> Plan d'Intervention IA
               </h4>
               <div className="space-y-3">
                 {analysis?.actionPlan?.map((step: string, i: number) => (
                   <div key={i} className="flex gap-4 items-center bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                      <p className="text-xs font-bold text-gray-700">{step}</p>
                   </div>
                 ))}
               </div>
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
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-700 pb-32">
      <div className="mb-12">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-gray-400 font-bold text-xs hover:text-gray-900 transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour Agora
        </button>
      </div>

      {editingReport && (
        <div className="fixed inset-0 z-[300] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-10 bg-emerald-50 border-b flex justify-between items-center">
                 <h3 className="text-2xl font-serif font-bold text-gray-900">Rectifier</h3>
                 <button onClick={() => setEditingReport(null)} className="p-3"><X /></button>
              </div>
              <div className="p-10 space-y-6">
                 <input value={editingReport.city} onChange={e => setEditingReport({...editingReport, city: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl font-bold" />
                 <input value={editingReport.sector} onChange={e => setEditingReport({...editingReport, sector: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl font-bold" />
                 <button onClick={handleUpdateReport} disabled={editLoading} className="w-full bg-gray-950 text-white py-6 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3">
                   {editLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Enregistrer
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-24">
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">Sentinelle <span className="text-emerald-500 italic">Verte</span></h1>
          <p className="text-gray-500 max-w-xl text-xl font-medium leading-relaxed italic">Chaque regard posé sur la cité est une promesse d'action.</p>
        </div>
        <button onClick={startCamera} className="w-full md:w-auto px-16 py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-3xl flex items-center justify-center gap-4 active:scale-95"><Camera size={28} /> Scanner le Territoire</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
         <div className="lg:col-span-2 space-y-16">
            <h3 className="text-3xl font-serif font-bold text-gray-900 flex items-center gap-4">Vos Signalements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="bg-white border rounded-[3.5rem] overflow-hidden shadow-sm transition-all group relative border-gray-100 hover:shadow-xl">
                    <div className="h-60 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Report" />
                       <div className="absolute top-6 right-6">
                          <button onClick={() => setEditingReport(r)} className="w-12 h-12 bg-white/90 backdrop-blur-md text-emerald-600 rounded-2xl flex items-center justify-center shadow-xl"><Pencil size={20} /></button>
                       </div>
                    </div>
                    <div className="p-10">
                       <h4 className="font-serif font-bold text-2xl mb-1 text-gray-900">{r.city}</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-blue-500">{r.sector}</p>
                       <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(r.timestamp || Date.now()).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full"><MapPin size={10} /><span className="text-[9px] font-black uppercase tracking-widest">Certifié</span></div>
                       </div>
                    </div>
                  </div>
              )) : (
                <div className="col-span-full py-32 text-center bg-gray-50 rounded-[5rem] border-2 border-dashed border-gray-200"><p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucun signalement archivé.</p></div>
              )}
            </div>
         </div>
         <aside className="space-y-10">
            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
               <h3 className="font-serif font-bold text-2xl flex items-center gap-4 text-gray-900"><Info className="text-blue-600" /> Guide</h3>
               <p className="text-xs text-gray-500 font-bold leading-relaxed">Le plan d'intervention est généré pour chaque signalement. Il guide les autorités et les citoyens vers une résolution concrète.</p>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default SentinelPage;
