
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  MapPin, 
  ArrowRight, 
  Trash2, 
  CheckCircle2, 
  ChevronLeft,
  Eye,
  AlertTriangle,
  History,
  Info,
  X
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchMyReports();
    return () => stopCamera();
  }, []);

  const fetchMyReports = async () => {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('waste_reports').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
      if (data) setReports(data as any);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
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
      addToast("Accès caméra refusé ou indisponible.", "error");
      setView('hub');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Assurer que les dimensions sont synchronisées avec la vidéo réelle
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(data);
        stopCamera();
        processImage(data);
      }
    } else {
      addToast("Capture impossible : matériel non prêt.", "error");
    }
  };

  const processImage = async (img: string) => {
    setView('processing');
    try {
      const [res, clean] = await Promise.all([
        analyzePollutionImage(img),
        generateCleanVision(img)
      ]);
      
      if (!res) {
        throw new Error("L'analyse a échoué.");
      }

      setAnalysis(res);
      setCleanVision(clean);
      setView('result');
    } catch (e) {
      console.error(e);
      addToast("L'IA n'a pas pu traiter l'image. Réessayez.", "error");
      setView('hub');
    }
  };

  const handlePublish = async () => {
    if (!analysis || !capturedImage) return;
    setLoading(true);
    
    const reportData = {
      author_id: user.id,
      image: capturedImage,
      clean_vision: cleanVision,
      city: analysis.city || "Inconnue",
      sector: analysis.sector || "Non spécifié",
      nature: analysis.nature || "Déchets mixtes",
      description: analysis.description || "Signalement Sentinelle",
      action_plan: analysis.actionPlan || [],
      insight: analysis.insight || "Impact citoyen identifié.",
      status: 'reported'
    };

    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('waste_reports').insert([reportData]);
        
        // Publication automatique dans le fil
        await supabase.from('posts').insert([{
          author_id: user.id,
          circle_type: CircleType.URBAN,
          content: `🌍 [SENTINELLE] Un dépôt de type ${analysis.nature} identifié à ${analysis.city}. ${analysis.insight}`,
          image_url: capturedImage,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);

        if (error) throw error;
        
        addToast("Sceau Sentinelle apposé ! +50 XP", "success");
        fetchMyReports();
        setView('hub');
      } else {
        addToast("Mode démo : Signalement simulé.", "info");
        setView('hub');
      }
    } catch (err) {
      addToast("Erreur lors de la publication.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="flex-1 object-cover" 
        />
        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-8 items-center px-10">
           <button onClick={() => { stopCamera(); setView('hub'); }} className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
             <X size={24} />
           </button>
           <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-[8px] border-white/20 active:scale-95 transition-all">
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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="relative mb-12">
          <div className="w-32 h-32 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <ShieldCheck size={48} className="text-emerald-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4">Éveil de l'Intelligence</h2>
        <p className="text-gray-400 max-w-xs mx-auto animate-pulse">Analyse structurelle et tissage de la vision propre en cours...</p>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-500">
        <button onClick={() => setView('hub')} className="flex items-center gap-2 text-gray-400 mb-8 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors"><ChevronLeft size={16}/> Annuler</button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white aspect-square group bg-gray-100">
              <img src={showClean ? cleanVision || capturedImage! : capturedImage!} className="w-full h-full object-cover transition-all duration-1000" alt="Capture" />
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">{showClean ? 'Vision Propre IA' : 'Réalité du terrain'}</span>
              </div>
              {cleanVision && (
                <button 
                  onClick={() => setShowClean(!showClean)}
                  className="absolute bottom-6 right-6 p-4 bg-emerald-500 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"
                >
                  <Eye size={24} />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold">{analysis?.nature || "Pollution identifiée"}</h3>
                <p className="text-xs text-gray-400 font-medium">{analysis?.city || "Localité"}, {analysis?.sector || "Secteur"}</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 italic text-emerald-800 text-sm leading-relaxed">
               "{analysis?.insight || "Analyse en cours..."}"
            </div>

            {analysis?.actionPlan && analysis.actionPlan.length > 0 && (
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Plan de Résolution</h4>
                 <div className="space-y-3">
                   {analysis.actionPlan.map((step: string, i: number) => (
                     <div key={i} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black border border-gray-200 shrink-0">{i+1}</span>
                        <p className="text-xs font-bold text-gray-700">{step}</p>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <button 
              onClick={handlePublish}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} className="text-emerald-400" />}
              Apposer le Sceau Sentinelle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 text-center md:text-left">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Sentinelle <span className="text-emerald-500 italic">Verte</span></h1>
          <p className="text-gray-500 max-w-xl text-lg font-medium leading-relaxed italic">
            "Le civisme territorial commence par le regard." <br/>
            Transformez votre environnement grâce à l'éveil numérique.
          </p>
        </div>
        <button 
          onClick={startCamera}
          className="w-full md:w-auto px-12 py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-4 active:scale-95"
        >
          <Camera size={24} /> Scanner le Territoire
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         <div className="lg:col-span-2 space-y-12">
            <section>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-8 px-4 flex items-center gap-3">
                <History className="text-blue-600" /> Mon Empreinte Verte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                    <div className="h-48 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Report" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute bottom-4 left-6">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-white border border-white/20 tracking-widest">{r.nature}</span>
                       </div>
                    </div>
                    <div className="p-8">
                       <h4 className="font-serif font-bold text-xl text-gray-900 mb-4">{r.city} • {r.sector}</h4>
                       <p className="text-gray-500 text-xs line-clamp-2 italic mb-6">"{r.insight}"</p>
                       <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(r.timestamp || Date.now()).toLocaleDateString()}</span>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14} /> Vérifié IA</span>
                       </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-24 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200">
                     <AlertTriangle className="w-16 h-16 text-gray-200 mx-auto mb-6 opacity-20" />
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucune empreinte verte active.</p>
                  </div>
                )}
              </div>
            </section>
         </div>

         <aside className="space-y-8">
            <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><ShieldCheck size={80} /></div>
               <div className="relative z-10">
                 <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4">STATUT SENTINELLE</h3>
                 <div className="text-6xl font-serif font-bold mb-4">{reports.length * 50}</div>
                 <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Points d'Impact Écologique</p>
                 <div className="mt-10 pt-8 border-t border-white/10">
                    <p className="text-xs italic leading-relaxed text-gray-400">"Chaque signalement aide les services de la cité à identifier les zones critiques pour une intervention prioritaire."</p>
                 </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
               <h3 className="font-serif font-bold text-xl flex items-center gap-3"><Info className="text-blue-600" /> Guide d'Impact</h3>
               <div className="space-y-4">
                  {[
                    { label: "Capturez le dépôt avec suffisamment de recul.", icon: "📸" },
                    { label: "L'IA identifie la nature des déchets.", icon: "🤖" },
                    { label: "Découvrez la Clean Vision pour agir.", icon: "✨" },
                    { label: "Validez pour notifier le réseau.", icon: "🚨" }
                  ].map((guide, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                       <span className="text-xl shrink-0">{guide.icon}</span>
                       <p className="text-xs text-gray-500 font-medium leading-relaxed">{guide.label}</p>
                    </div>
                  ))}
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default SentinelPage;
