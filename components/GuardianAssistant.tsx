
import React, { useState } from 'react';
import { MessageSquare, X, Send, Crown, Sparkles, Loader2, Fingerprint } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const GuardianAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "Tu es l'Esprit du Gardien, le guide IA du Cercle Citoyen. Ton ton est noble, bienveillant et solennel. Tu aides les citoyens à comprendre le fonctionnement de l'app (cercles, édits, impact) et tu les encourages dans leurs projets. Réponds toujours de façon concise (max 3 sentences).",
        }
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || "La sagesse me manque à cet instant précis." }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 lg:bottom-10 right-6 lg:right-10 z-[150]">
      {isOpen ? (
        <div className="w-[320px] sm:w-[380px] bg-white rounded-[2.5rem] shadow-2xl border border-blue-100 flex flex-col overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
          <div className="p-6 bg-gray-950 text-white flex justify-between items-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Crown size={40} /></div>
             <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                   <Fingerprint size={20} />
                </div>
                <div>
                   <h3 className="font-serif font-bold">L'Esprit du Gardien</h3>
                   <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Assistant Souverain</p>
                </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors relative z-10"><X size={20} /></button>
          </div>
          
          <div className="flex-1 h-[350px] overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                 <Sparkles className="text-blue-600 mb-4 animate-pulse" size={32} />
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Posez une question sur le Cercle...</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-blue-50 text-gray-800 rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-blue-50 p-4 rounded-2xl flex gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-50 bg-white">
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200 focus-within:bg-white focus-within:border-blue-200 transition-all">
               <input 
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyPress={e => e.key === 'Enter' && handleAsk()}
                 placeholder="Demander conseil..." 
                 className="flex-1 bg-transparent outline-none px-3 text-xs font-bold"
               />
               <button 
                 onClick={handleAsk}
                 className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-black transition-colors"
               >
                 <Send size={16} />
               </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 hover:scale-110 hover:rotate-12 transition-all group border-4 border-white"
        >
          <div className="relative">
             <Crown size={28} className="group-hover:animate-pulse" />
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-20"></div>
          </div>
        </button>
      )}
    </div>
  );
};

export default GuardianAssistant;
