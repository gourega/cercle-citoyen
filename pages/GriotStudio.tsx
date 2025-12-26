
import React, { useState, useEffect } from 'react';
import { Video, Loader2, Download, Play, HelpCircle, ShieldAlert, Smartphone, History, AlertCircle, X, CheckCircle, Sparkles, Send, Smartphone as PhoneIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../App';

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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xl">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-[#00adef] p-8 flex flex-col items-center text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <img src="https://www.wave.com/static/favicon.png" className="w-10 h-10" alt="Wave" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-center">Soutenir avec Wave</h3>
        </div>
        
        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6 flex flex-col items-center">
              <p className="text-sm text-gray-500 leading-relaxed text-center font-medium">
                La génération de vidéos par IA est coûteuse. Votre soutien via Wave permet de maintenir cet outil au service de la cité.
              </p>
              
              <div className="p-4 bg-gray-50 rounded-[2rem] border-2 border-[#00adef]/20 shadow-inner">
                <img 
                  src="https://nfsskgcpqbccnwacsplc.supabase.co/storage/v1/object/public/assets/wave-qr-sample.png" 
                  className="w-40 h-40 opacity-80" 
                  alt="QR Code Wave" 
                />
              </div>

              <button 
                onClick={handleWaveSupport}
                disabled={loading}
                className="w-full bg-[#00adef] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#008cc2] transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <PhoneIcon size={18} />}
                Payer avec Wave (Mobile)
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Soutien Transmis</h4>
              <p className="text-sm text-gray-500 mb-8 px-4">
                Le Griot vous remercie pour ce geste souverain.
              </p>
              <button 
                onClick={onClose}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Fermer
              </button>
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
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }

    setLoading(true);
    setLoadingStage('Le Griot imagine votre vision...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A cinematic mobilization clip: ${prompt}`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
      
      setLoadingStage('Tissage des ondes numériques (1-2 min)...');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
      
      setVideoUrl(finalUrl);
      
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      localStorage.setItem('griot_daily_limit', JSON.stringify({ date: new Date().toLocaleDateString(), count: newCount }));
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
        await (window as any).aistudio.openSelectKey();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      {showContrib && <ContributionModal onClose={() => setShowContrib(false)} />}

      <div className="text-center mb-16">
        <div className="w-24 h-24 bg-amber-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-100 ring-8 ring-amber-50">
           <Video className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Le Griot Numérique</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
          Racontez l'avenir de votre cité en images animées. L'IA au service de l'éveil citoyen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform">
              <Sparkles className="w-32 h-32 text-amber-600" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Souveraineté Créative</span>
              </div>
              <div className="px-4 py-1 bg-gray-50 rounded-full text-[10px] font-black uppercase text-gray-400 tracking-widest">
                {dailyCount}/2 essais restants
              </div>
            </div>

            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 px-2">Vision à animer (Prompt)</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez une scène d'impact social : entraide, construction, solidarité..."
              className="w-full h-56 bg-gray-50 rounded-3xl p-8 text-gray-800 outline-none border border-transparent focus:border-amber-100 focus:bg-white transition-all resize-none mb-8 text-lg font-medium leading-relaxed"
            />
            
            <button 
              onClick={handleGenerate}
              disabled={loading || dailyCount >= 2 || !prompt.trim()}
              className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-lg hover:bg-black transition-all shadow-2xl shadow-gray-200 flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-6 h-6" />}
              {loading ? loadingStage : "Éveiller le Griot"}
            </button>
          </div>

          <div className="bg-amber-50/50 p-10 rounded-[3rem] border border-amber-100 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <HelpCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-amber-900 text-xl font-serif">Aidez-nous à rester libres</h3>
            </div>
            <p className="text-sm text-amber-800 leading-relaxed font-medium">
              Chaque vidéo générée est financée par les citoyens. Soutenez l'infrastructure via <b>Wave</b> pour garantir l'accès de tous à cet outil.
            </p>
            <button 
              onClick={() => setShowContrib(true)}
              className="w-full py-5 bg-[#00adef] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#008cc2] transition-all shadow-xl shadow-[#00adef]/20 flex items-center justify-center gap-3"
            >
              <Smartphone size={18} /> Faire un don avec Wave
            </button>
          </div>
        </div>

        <div className="relative sticky top-24">
          {videoUrl ? (
            <div className="space-y-8 animate-in fade-in zoom-in duration-1000">
              <div className="rounded-[3.5rem] overflow-hidden shadow-2xl bg-black aspect-video border-[12px] border-white ring-1 ring-gray-100 flex items-center justify-center">
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
              </div>
              <button className="w-full bg-white border border-gray-100 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm">
                <Download className="w-5 h-5 text-blue-600" /> Sauvegarder la Vision
              </button>
            </div>
          ) : (
            <div className="aspect-video bg-gray-950 rounded-[3.5rem] flex flex-col items-center justify-center text-center p-12 border-[12px] border-white shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px'}}></div>
              {loading ? (
                <div className="space-y-8 relative z-10">
                   <div className="w-24 h-24 mx-auto relative">
                      <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <Video className="w-10 h-10 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                   </div>
                   <p className="text-white font-bold text-xl font-serif italic">{loadingStage}</p>
                </div>
              ) : (
                <div className="space-y-10 relative z-10">
                  <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform duration-500 border border-gray-800">
                    <Play className="w-10 h-10 text-gray-700 ml-1" />
                  </div>
                  <div>
                    <h3 className="text-white font-serif font-bold text-3xl mb-4">Le Cinéma Citoyen</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                      L'IA Véo 3.1 transforme vos prompts en mobilisations visuelles de haute qualité.
                    </p>
                  </div>
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
