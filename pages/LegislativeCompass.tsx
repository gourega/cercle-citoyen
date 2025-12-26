
import React, { useState } from 'react';
import { Gavel, Sparkles, Loader2, Info, AlertTriangle, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { simplifyLegalText } from '../lib/gemini';

const LegislativeCompass: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{summary: string, impacts: string[], alerts: string[]} | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await simplifyLegalText(text);
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">La Boussole des Lois</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Comprendre pour mieux agir. Copiez un texte législatif, un décret ou un contrat complexe, et laissez l'IA vous l'expliquer simplement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Texte à analyser</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Collez ici l'article de loi, le décret ou le document complexe..."
              className="w-full h-80 bg-gray-50 rounded-2xl p-6 text-gray-800 outline-none border border-gray-50 focus:border-blue-100 focus:bg-white transition-all resize-none mb-6 text-sm leading-relaxed"
            ></textarea>
            
            <button 
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Gavel className="w-6 h-6" />}
              Décrypter le texte
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {analysis ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <FileText className="w-32 h-32 text-blue-900" />
                </div>
                <h3 className="text-blue-900 font-black text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Résumé Citoyen
                </h3>
                <p className="text-gray-800 text-lg leading-relaxed font-medium">
                  {analysis.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100">
                  <h3 className="text-emerald-900 font-black text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Ce qui change pour vous
                  </h3>
                  <ul className="space-y-4">
                    {analysis.impacts.map((imp, i) => (
                      <li key={i} className="flex gap-3 text-sm text-emerald-800 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100">
                  <h3 className="text-amber-900 font-black text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Points de vigilance
                  </h3>
                  <ul className="space-y-4">
                    {analysis.alerts.map((alt, i) => (
                      <li key={i} className="flex gap-3 text-sm text-amber-800 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                Partager cette analyse dans un Cercle <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12">
              <div className={`w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm ${loading ? 'animate-pulse' : ''}`}>
                <FileText className="w-8 h-8 text-gray-200" />
              </div>
              <h3 className="text-gray-900 font-bold mb-2">L'intelligence à votre service</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Une fois l'analyse lancée, vous découvrirez ici une version simplifiée et actionnable du texte soumis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegislativeCompass;
