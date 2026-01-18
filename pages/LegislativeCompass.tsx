
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, Sparkles, Loader2, Info, AlertTriangle, CheckCircle2, FileText, ArrowRight, ChevronLeft, Search } from 'lucide-react';
import { simplifyLegalText } from '../lib/gemini';

const StepCard: React.FC<{ icon: React.ReactNode, title: string, text: string, color: string }> = ({ icon, title, text, color }) => (
  <div className={`p-6 rounded-[2rem] border ${color} bg-white/50 flex flex-col items-center text-center shadow-sm`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm bg-white text-gray-900`}>
      {icon}
    </div>
    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">{title}</h4>
    <p className="text-xs text-gray-500 font-medium leading-relaxed">{text}</p>
  </div>
);

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
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors text-sm font-bold group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour Agora
      </Link>

      <div className="text-center mb-16">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-200">
           <Gavel className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">La Boussole des Lois</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium italic">
          "Nul n'est censé ignorer la loi, encore faut-il la comprendre." <br/>
          La Boussole utilise l'IA pour traduire le jargon juridique en langage clair et actionnable pour chaque citoyen.
        </p>
      </div>

      {/* SECTION EXPLICATIVE : LE CYCLE DE LA CLARTÉ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <StepCard 
          icon={<FileText className="text-blue-600" />}
          title="1. Soumettez"
          text="Copiez-collez un décret, un article de loi ou un contrat complexe qui impacte votre vie."
          color="border-blue-100 bg-blue-50/20"
        />
        <StepCard 
          icon={<Sparkles className="text-indigo-500" />}
          title="2. Décryptez"
          text="L'IA extrait l'essentiel, identifie vos droits et pointe les zones de vigilance."
          color="border-indigo-100 bg-indigo-50/20"
        />
        <StepCard 
          icon={<Gavel className="text-amber-500" />}
          title="3. Agissez"
          text="Utilisez cette clarté pour faire valoir vos droits ou proposer une réforme via le RIC."
          color="border-amber-100 bg-amber-50/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Document à analyser</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Collez ici l'article de loi, le décret ou le document complexe..."
              className="w-full h-80 bg-gray-50 rounded-2xl p-8 text-gray-800 outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all resize-none mb-6 text-base leading-relaxed placeholder:text-gray-300"
            ></textarea>
            
            <button 
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6 text-blue-400" />}
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
              
              <button className="w-full py-5 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-gray-100">
                Partager cette analyse dans un Cercle <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12 shadow-sm group hover:bg-gray-50/50 transition-all">
              <div className={`w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner text-gray-200 group-hover:text-blue-200 transition-colors ${loading ? 'animate-pulse' : ''}`}>
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-gray-900 font-bold mb-2">L'intelligence à votre service</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px]">
                Une version simplifiée et actionnable apparaîtra ici
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegislativeCompass;
