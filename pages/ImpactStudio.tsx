
import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Loader2, Image as ImageIcon, ArrowRight, ShieldAlert, Smartphone, History, AlertCircle, X, CheckCircle, ExternalLink, QrCode, Copy } from 'lucide-react';
import { generateImpactVisual } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useToast } from '../App';

const ContributionModal: React.FC<{ onClose: () => void, user: User }> = ({ onClose, user }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleWavePayment = async () => {
    setLoading(true);
    const { error } = await supabase.from('contributions').insert([{
      user_id: user.id,
      amount: 5000,
      provider: 'Wave',
      status: 'pending'
    }]);
    
    if (!error) {
      setStep(2);
      addToast("Don initié via Wave. Scannez le code pour terminer.", "success");
    } else {
      addToast("Une erreur est survenue.", "error");
    }
    setLoading(false);
  };

  const copyWaveLink = () => {
    navigator.clipboard.writeText("https://pay.wave.com/cercle-citoyen");
    addToast("Lien Wave copié !", "success");
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xl">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-[#00adef] p-8 flex flex-col items-center text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
            <img src="https://www.wave.com/static/favicon.png" className="w-12 h-12" alt="Wave" />
          </div>
          <h3 className="text-3xl font-serif font-bold text-center">Soutenir via <br/><span className="italic">Wave</span></h3>
        </div>
        
        <div className="p-8 text-center">
          {step === 1 ? (
            <div className="space-y-8 flex flex-col items-center">
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Aidez-nous à financer l'intelligence souveraine du Cercle.
              </p>

              <div className="bg-white p-4 rounded-3xl border-4 border-[#00adef]/20 shadow-inner">
                <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <QrCode size={120} className="text-gray-900 opacity-80" />
                  <div className="absolute inset-0 bg-[#00adef]/5 flex items-center justify-center">
                    <div className="bg-white p-2 rounded-xl shadow-md">
                      <img src="https://www.wave.com/static/favicon.png" className="w-6 h-6" alt="Wave" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={handleWavePayment}
                  disabled={loading}
                  className="w-full bg-[#00adef] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#008cc2] transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Smartphone className="w-5 h-5" />}
                  Ouvrir l'application Wave
                </button>
                <button 
                  onClick={copyWaveLink}
                  className="w-full py-4 border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> Copier le lien Wave
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-2xl font-serif font-bold text-gray-900 mb-2">Paiement enregistré</h4>
              <p className="text-sm text-gray-500 mb-8 px-4">Merci citoyen ! Votre aide est précieuse pour l'autonomie du réseau.</p>
              <button 
                onClick={onClose}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Retour au Studio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ImpactStudio: React.FC<{ user: User }> = ({ user }) => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showContrib, setShowContrib] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const url = await generateImpactVisual(prompt);
      setImage(url);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      {showContrib && <ContributionModal onClose={() => setShowContrib(false)} user={user} />}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Studio d'Impact</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
          Générez des visuels puissants pour vos campagnes citoyennes et mobilisez votre territoire.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform">
            <Sparkles className="w-32 h-32 text-blue-600" />
          </div>
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Script de Vision (Prompt)</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: 'Une coopérative de femmes transformant le cacao à l'aide d'énergie solaire, style cinématographique...'"
            className="w-full h-48 bg-gray-50 rounded-[2rem] p-8 text-gray-800 outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all resize-none mb-8 text-lg font-medium leading-relaxed"
          />
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl shadow-gray-200"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6 text-blue-400" />}
              Générer le visuel IA
            </button>
            <button 
              onClick={() => setShowContrib(true)} 
              className="w-full py-5 bg-blue-50 text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 border border-blue-100/50"
            >
              Soutenir le Cercle via Wave
            </button>
          </div>
        </div>

        <div className="relative group">
          {image ? (
            <div className="animate-in fade-in zoom-in duration-1000">
               <img src={image} className="w-full rounded-[3.5rem] shadow-2xl border-[10px] border-white ring-1 ring-gray-100" alt="Génération" />
               <div className="absolute bottom-6 right-6 flex gap-3">
                 <button onClick={() => window.open(image, '_blank')} className="p-4 bg-white/90 backdrop-blur-md text-gray-900 rounded-2xl shadow-xl hover:bg-white transition-all active:scale-95">
                   <Download size={20} />
                 </button>
               </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-50 rounded-[3.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12 transition-all group-hover:bg-white group-hover:border-blue-100">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-inner flex items-center justify-center mb-6 text-gray-200 group-hover:text-blue-200 transition-colors">
                 <ImageIcon size={40} />
              </div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest max-w-[200px]">Votre vision territoriale apparaîtra ici</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactStudio;
