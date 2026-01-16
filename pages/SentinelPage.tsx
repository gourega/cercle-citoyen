
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
  CheckCircle
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
        const data = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(data);
        stopCamera();
        processImage(data);
      }
    }
  };

  const processImage = async (img: string) => {
    setView('processing');
    try {
      // Analyse et Vision Propre lancées en parallèle
      const [res, clean] = await Promise.all([
        analyzePollutionImage(img),
        generateCleanVision(img).catch(err => {
          console.error("CleanVision Error:", err);
          return null;
        })
      ]);
      
      if (!res || Object.keys(res).length === 0) {
        throw new Error("L'intelligence n'a pas pu identifier la structure de la pollution.");
      }

      setAnalysis(res);
      setCleanVision(clean);
      setView('result');
    } catch (e: any) {
      console.error("ProcessImage Error:", e);
      addToast(e.message || "Échec de l'analyse. Réessayez avec un meilleur éclairage.", "error");
      setView('hub');
    }
  };

  const handlePublish = async () => {
    if (!analysis || !capturedImage) return;
    setLoading(true);
    
    try {
      const reportData = {
        author_id: user.id,
        image: capturedImage,
        clean_vision: cleanVision,
        city: analysis.city || "Inconnue",
        sector: analysis.sector || "Non spécifié",
        nature: analysis.nature || "Divers",
        description: analysis.description || "Signalement Sentinelle",
        action_plan: analysis.actionPlan || [],
        insight: analysis.insight || "Impact identifié.",
        status: 'reported'
      };

      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('waste_reports').insert([reportData]);
        if (error) throw error;

        await supabase.from('posts').insert([{
          author_id: user.id,
          circle_type: CircleType.URBAN,
          content: `🚨 [SENTINELLE VERTE] ${analysis.nature} identifié à ${analysis.city}. ${analysis.insight}`,
          image_url: capturedImage,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);

        addToast("Sceau Sentinelle apposé ! +50 XP", "success");
        fetchMyReports();
        setView('hub');
      } else {
        addToast("Mode démo : Signalement simulé.", "info");
        setView('hub');
      }
    } catch (err) {
      addToast("Erreur de publication.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover" />
        <div className="absolute bottom-12 inset-x-0 flex justify-center gap-10 items-center">
           <button onClick={() => { stopCamera(); setView('hub'); }} className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white">
             <X size={24} />
           </button>
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4 flex items-center gap-3">
          <Sparkles className="text-emerald-400" /> Analyse Structurelle
        </h2>
        <p className="text-gray-400 max-w-xs mx-auto animate-pulse uppercase text-[10px] font-black tracking-widest">
          Interrogation de l'Esprit du Gardien...
        </p>
        <style>{`
          @keyframes scan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
        `}</style>
      </div>
    );
  }

  if (view === 'result') {
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
                 <button 
                  onClick={() => setShowClean(!showClean)}
                  className={`px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl ${showClean ? 'bg-emerald-500 text-white' : 'bg-white/90 text-gray-900 backdrop-blur-md'}`}
                >
                  {showClean ? <CheckCircle size={16}/> : <Sparkles size={16}/>}
                  {showClean ? 'Vision Propre Active' : 'Révéler la Vision Propre'}
                </button>
              </div>

              {!showClean && (
                <div className="absolute top-8 left-8 bg-rose-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                  État Réel Constaté
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-sm space-y-8 flex flex-col">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-gray-900">{analysis?.nature}</h3>
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest ml-14">{analysis?.city}, {analysis?.sector}</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 italic text-gray-600 text-sm leading-relaxed relative">
               <div className="absolute -top-3 left-8 bg-white border border-gray-100 px-3 py-1 rounded-full text-[8px] font-black uppercase text-blue-600 tracking-widest">Avis IA</div>
               "{analysis?.insight}"
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Étapes de Résolution</h4>
               <div className="space-y-3">
                 {analysis?.actionPlan?.map((step: string, i: number) => (
                   <div key={i} className="flex gap-4 items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                      <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-[11px] font-black shrink-0">{i+1}</span>
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
              Apposer le Sceau Sentinelle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-24">
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6 tracking-tight">Sentinelle <span className="text-emerald-500 italic">Verte</span></h1>
          <p className="text-gray-500 max-w-xl text-xl font-medium leading-relaxed italic">
            "Chaque regard posé sur la cité est une promesse d'action." <br/>
            Éveillez la conscience collective par l'image.
          </p>
        </div>
        <button 
          onClick={startCamera}
          className="w-full md:w-auto px-16 py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-3xl shadow-emerald-100 flex items-center justify-center gap-4 active:scale-95"
        >
          <Camera size={28} /> Scanner le Territoire
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
         <div className="lg:col-span-2 space-y-16">
            <section>
              <div className="flex items-center justify-between mb-10 px-4">
                <h3 className="text-3xl font-serif font-bold text-gray-900 flex items-center gap-4">
                  <History className="text-blue-600" /> Empreintes Actives
                </h3>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{reports.length} Signalements</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reports.length > 0 ? reports.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group">
                    <div className="h-60 relative overflow-hidden bg-gray-100">
                       <img src={r.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Report" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                       <div className="absolute bottom-6 left-8">
                          <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-white border border-white/20 tracking-widest">{r.nature}</span>
                       </div>
                    </div>
                    <div className="p-10">
                       <h4 className="font-serif font-bold text-2xl text-gray-900 mb-4">{r.city} • {r.sector}</h4>
                       <p className="text-gray-500 text-sm italic mb-8 line-clamp-2">"{r.insight}"</p>
                       <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(r.timestamp || Date.now()).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                            <CheckCircle2 size={12} />
                            <span className="text-[9px] font-black uppercase">Certifié IA</span>
                          </div>
                       </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-32 text-center bg-gray-50 rounded-[5rem] border-2 border-dashed border-gray-200">
                     <AlertTriangle className="w-20 h-20 text-gray-200 mx-auto mb-8 opacity-20" />
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Le territoire ne présente aucune alerte.</p>
                  </div>
                )}
              </div>
            </section>
         </div>

         <aside className="space-y-10">
            <div className="bg-gray-950 text-white p-12 rounded-[4rem] shadow-3xl relative overflow-hidden group border border-white/5">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><ShieldCheck size={100} /></div>
               <div className="relative z-10">
                 <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-6">STATUT SENTINELLE</h3>
                 <div className="text-7xl font-serif font-bold mb-4">{reports.length * 50}</div>
                 <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Points d'Action Écologique</p>
                 <div className="mt-12 pt-10 border-t border-white/10 italic text-sm text-gray-400 leading-relaxed">
                    "Une Sentinelle ne se contente pas de voir le chaos, elle prépare le terrain de l'ordre citoyen."
                 </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
               <h3 className="font-serif font-bold text-2xl flex items-center gap-4 text-gray-900"><Info className="text-blue-600" /> Guide de l'Action</h3>
               <div className="space-y-6">
                  {[
                    { label: "Capturez la zone avec netteté.", icon: "📸" },
                    { label: "L'IA identifie les risques sanitaires.", icon: "🤖" },
                    { label: "Visualisez la transformation idéale.", icon: "✨" },
                    { label: "Publiez pour lancer l'alerte locale.", icon: "🚨" }
                  ].map((guide, i) => (
                    <div key={i} className="flex gap-5 items-start">
                       <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shrink-0 border border-gray-100">{guide.icon}</div>
                       <p className="text-sm text-gray-500 font-bold leading-relaxed">{guide.label}</p>
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
