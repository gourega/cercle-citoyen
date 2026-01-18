
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Loader2, Play, Sparkles, Send, ChevronLeft, X, CheckCircle, Smartphone as PhoneIcon, PenTool, Tv, Rocket, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../ToastContext.tsx';

const StepCard: React.FC<{ icon: React.ReactNode, title: string, text: string, color: string }> = ({ icon, title, text, color }) => (
  <div className={`p-6 rounded-[2rem] border ${color} bg-white/50 flex flex-col items-center text-center shadow-sm`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm bg-white text-gray-900`}>
      {icon}
    </div>
    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">{title}</h4>
    <p className="text-xs text-gray-500 font-medium leading-relaxed">{text}</p>
  </div>
);

const ContributionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleWaveSupport = () => {
    setLoading(true);
    setTimeout(() => {
      setStep(2);
      setLoading(false);
      addToast("Don initié via Wave", "success");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-[#00adef] p-8 flex flex-col items-center text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"><X size={24} /></button>
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg"><img src="https://www.wave.com/static/favicon.png" className="w-8 h-8" alt="Wave" /></div>
          <h3 className="text-xl font-serif font-bold text-center text-white">Soutenir le Griot</h3>
        </div>
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6 flex flex-col items-center">
              <p className="text-xs text-gray-500 leading-relaxed text-center font-bold uppercase tracking-widest">Le financement citoyen garantit notre autonomie.</p>
              <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-inner"><img src="https://nfsskgcpqbccnwacsplc.supabase.co/storage/v1/object/public/assets/wave-qr-sample.png" className="w-32 h-32 opacity-80" alt="QR" /></div>
              <button onClick={handleWaveSupport} disabled={loading} className="w-full bg-[#00adef] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#008cc2] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#00adef]/20">
                {loading ? <Loader2 className="animate-spin" /> : <PhoneIcon size={16} />} Soutenir via Wave
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500"><CheckCircle size={32} /></div>
              <p className="text-sm font-bold text-gray-900 mb-6">Merci pour votre soutien souverain.</p>
              <button onClick={onClose} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Fermer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GriotStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [dailyCount, setDailyCount] = useState(0);
  const [showContrib, setShowContrib] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const stored = localStorage.getItem('griot_daily_limit');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) setDailyCount(count);
    }
  }, []);

  const handleGenerate = async () => {
    if (dailyCount >= 2 || !prompt.trim()) return;
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
    setLoading(true);
    setLoadingStage('Le Griot tisse votre vision...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Cinematic clip: ${prompt}`,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!operation.done) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      setVideoUrl(`${downloadLink}&key=${process.env.API_KEY}`);
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      localStorage.setItem('griot_daily_limit', JSON.stringify({ date: new Date().toLocaleDateString(), count: newCount }));
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) await (window as any).aistudio.openSelectKey();
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700 bg-[#fcfcfc] min-h-screen text-gray-900">
      <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors text-xs font-bold group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour Agora
      </Link>
      {showContrib && <ContributionModal onClose={() => setShowContrib(false)} />}

      <div className="text-center mb-16">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-200">
           <Video className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">Le Griot Numérique</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed italic">
          "Donner un visage à nos rêves pour mieux les bâtir." <br/>
          Le Griot utilise l'IA pour transformer vos ambitions citoyennes en récits visuels inspirants.
        </p>
      </div>

      {/* SECTION EXPLICATIVE : LE CYCLE DE LA VISION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <StepCard 
          icon={<PenTool className="text-amber-600" />}
          title="1. Pensez"
          text="Imaginez une scène d'impact social positif pour votre quartier ou la Nation."
          color="border-amber-100 bg-amber-50/20"
        />
        <StepCard 
          icon={<Tv className="text-blue-500" />}
          title="2. Visualisez"
          text="Décrivez votre idée. Le Griot tissera un clip vidéo pour illustrer cette vision."
          color="border-blue-100 bg-blue-50/20"
        />
        <StepCard 
          icon={<Rocket className="text-emerald-500" />}
          title="3. Mobilisez"
          text="Partagez la vidéo pour rallier vos concitoyens autour de vos projets réels."
          color="border-emerald-100 bg-emerald-50/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2"><Sparkles size={12}/> Script de l'avenir</span>
              <span className="px-3 py-1 bg-gray-50 rounded-full text-[9px] font-black uppercase text-gray-400">{dailyCount}/2 essais</span>
            </div>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="Décrivez une scène d'impact social (ex: un marché propre, une école solaire, une entraide entre quartiers)..." 
              className="w-full h-40 bg-gray-50 rounded-[1.5rem] p-6 text-gray-800 outline-none border border-transparent focus:border-amber-100 focus:bg-white transition-all resize-none mb-6 font-medium placeholder:text-gray-300" 
            />
            <button 
              onClick={handleGenerate} 
              disabled={loading || dailyCount >= 2 || !prompt.trim()} 
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={16} />} {loading ? "Le Griot tisse..." : "Éveiller le Griot"}
            </button>
          </div>
          <button onClick={() => setShowContrib(true)} className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100">Aider à financer l'infrastructure</button>
        </div>

        <div className="relative">
          {videoUrl ? (
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-video border-[8px] border-white ring-1 ring-gray-100 animate-in zoom-in duration-700">
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-white rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 shadow-sm transition-all hover:bg-gray-50/50 group">
              {loading ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                  <p className="text-gray-400 font-bold italic">{loadingStage}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200 group-hover:text-amber-200 transition-colors">
                    <Play className="w-8 h-8" />
                  </div>
                  <p className="text-gray-300 font-black text-[10px] uppercase tracking-[0.2em]">Votre vision sera révélée ici</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GriotStudio;
