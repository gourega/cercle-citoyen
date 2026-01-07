
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

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('waste_reports').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
      if (data) setReports(data as any);
    }
  };

  const startCamera = async () => {
    setView('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
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
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setCapturedImage(data);
      processImage(data);
      
      // Stop stream
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
  };

  const processImage = async (img: string) => {
    setView('processing');
    try {
      const res = await analyzePollutionImage(img);
      const clean = await generateCleanVision(img);
      setAnalysis(res);
      setCleanVision(clean);
      setView('result');
    } catch (e) {
      addToast("L'IA n'a pas pu traiter l'image.", "error");
      setView('hub');
    }
  };

  const handlePublish = async () => {
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
      status: analysis.status
    };

    if (isRealSupabase && supabase) {
      const { error } = await supabase.from('waste_reports').insert([reportData]);
      
      // On publie aussi automatiquement dans le fil citoyen
      await supabase.from('posts').insert([{
        author_id: user.id,
        circle_type: CircleType.URBAN,
        content: `🌍 [SENTINELLE] Un dépôt de type ${analysis.nature} identifié à ${analysis.city}. ${analysis.insight}`,
        image_url: capturedImage,
        reactions: { useful: 0, relevant: 0, inspiring: 0 }
      }]);

      if (!error) {
        addToast("Sceau Sentinelle apposé ! +50 XP", "success");
        fetchMyReports();
        setView('hub');
      }
    } else {
      addToast("Mode démo : Signalement simulé.", "info");
      setView('hub');
    }
    setLoading(false);
  };

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-8 items-center px-10">
           <button onClick={() => setView('hub')} className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
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
        <p className="text-gray-400 max-w-xs mx-auto animate-pulse">Analyse structurelle, détection de nature et tissage de la Clean Vision...</p>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-500">
        <button onClick={() => setView('hub')} className="flex items-center gap-2 text-gray-400 mb-8 font-black text-[10px] uppercase tracking-widest"><ChevronLeft size={16}/> Annuler</button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white aspect-square group">
              <img src={showClean ? cleanVision || capturedImage! : capturedImage!} className="w-full h-full object-cover transition-all duration-1000" alt="" />
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">{showClean ? 'Vision Propre IA' : 'Réalité du terrain'}</span>
              </div>
              <button 
                onClick={() => setShowClean(!showClean)}
                className="absolute bottom-6 right-6 p-4 bg-emerald-500 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"
              >
                <Eye size={24} />
              </button>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold">{analysis.nature}</h3>
                <p className="text-xs text-gray-400 font-medium">{analysis.city}, {analysis.sector}</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 italic text-emerald-800 text-sm leading-relaxed">
               "{analysis.insight}"
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Plan de Résolution</h4>
               <div className="space-y-3">
                 {analysis.actionPlan?.map((step: string, i: number) => (
                   <div key={i} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black border border-gray-200">{i+1}</span>
                      <p className="text-xs font-bold text-gray-700">{step}</p>
                   </div>
                 ))}
               </div>
            </div>

            <button 
              onClick={handlePublish}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3"
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
                    <div className="h-48 relative overflow-hidden">
                       <img src={r.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
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
                  <div className="col-span-full py-24 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-100">
                     <AlertTriangle className="w-16 h-16 text-gray-200 mx-auto mb-6" />
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
                    { label: "Capturez le dépôt de loin pour donner du contexte.", icon: "📸" },
                    { label: "L'IA identifie automatiquement la nature.", icon: "🤖" },
                    { label: "Découvrez la Clean Vision pour voir le potentiel.", icon: "✨" },
                    { label: "Validez pour alerter le Pouls Urbain.", icon: "🚨" }
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
