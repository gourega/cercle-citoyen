
import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, ChevronLeft, Fingerprint, Crown, X, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User as UserType, Message } from '../types';
import { mediateChat, getConsensusSummary, getGriotReading, decodeBase64Audio, decodeAudioBuffer } from '../lib/gemini';

const ChatPage: React.FC<{ user: UserType }> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender_id: 'ai',
      sender_name: 'L\'Esprit du Gardien',
      sender_avatar: '',
      content: 'Citoyen, bienvenue en cette enceinte de sagesse. Ici, la parole est un acte de construction. Exprime-toi avec clarté, car le Gardien t\'écoute.',
      created_at: 'Maintenant',
      is_ai: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isMediating, setIsMediating] = useState(false);
  const [consensus, setConsensus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.name,
      sender_avatar: user.avatar,
      content: input,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    if (messages.length % 3 === 0) handleMediation([...messages, newMessage]);
  };

  const handleMediation = async (currentMessages: Message[]) => {
    setIsMediating(true);
    try {
      const chatContext = currentMessages.slice(-5).map(m => ({ sender: m.sender_name || 'Citoyen', text: m.content }));
      const aiResponse = await mediateChat(chatContext);
      if (aiResponse) {
        setMessages(prev => [...prev, {
          id: 'ai-' + Date.now(),
          sender_id: 'ai',
          sender_name: 'L\'Esprit du Gardien',
          sender_avatar: '',
          content: aiResponse,
          created_at: 'Instantané',
          is_ai: true
        }]);
      }
    } catch (e) { console.error(e); } finally { setIsMediating(false); }
  };

  const playAudio = async (text: string) => {
    try {
      const base64Audio = await getGriotReading(text);
      if (base64Audio) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = decodeBase64Audio(base64Audio);
        const buffer = await decodeAudioBuffer(bytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto bg-white shadow-2xl rounded-[3rem] my-4 overflow-hidden border border-gray-100 relative">
      {/* Background Pattern - Super Low Opacity for Readability */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/woven.png')] z-0"></div>

      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-4">
          <Link to="/feed" className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-amber-600"><ChevronLeft /></Link>
          <div>
            <h2 className="font-serif font-bold text-2xl text-gray-900 tracking-tight">La Salle des Palabres</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Sparkles size={12} /> Sous la médiation du Gardien
            </p>
          </div>
        </div>
        <button 
          onClick={async () => {
            setIsMediating(true);
            const res = await getConsensusSummary(messages.map(m => ({ sender: m.sender_name || 'Citoyen', text: m.content })));
            setConsensus(res || "Pas encore de consensus.");
            setIsMediating(false);
          }}
          disabled={isMediating}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
        >
          {isMediating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
          Consulter l'Esprit
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 relative z-10">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[85%] md:max-w-[70%] flex gap-5 ${m.sender_id === user.id ? 'flex-row-reverse' : ''}`}>
              <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg ${m.is_ai ? 'bg-gray-900 text-amber-500' : 'bg-white'}`}>
                {m.is_ai ? <Crown className="w-7 h-7" /> : <img src={m.sender_avatar} className="w-full h-full object-cover" />}
              </div>
              <div className="space-y-3">
                <div className={`p-8 rounded-[2.5rem] shadow-sm relative group transition-all ${
                  m.sender_id === user.id 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : m.is_ai 
                      ? 'bg-white border-2 border-amber-200 text-gray-900 shadow-xl shadow-amber-50/30 rounded-tl-none' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${m.sender_id === user.id ? 'text-blue-100' : 'text-amber-600'}`}>
                    {m.sender_name}
                  </p>
                  <p className={`text-[17px] leading-relaxed font-medium ${m.is_ai ? 'font-serif italic text-lg' : ''}`}>
                    {m.content}
                  </p>
                  <button 
                    onClick={() => playAudio(m.content)}
                    className="absolute -right-12 top-4 p-2.5 text-gray-300 hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-full shadow-lg border border-gray-50"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter px-4">
                  {m.created_at}
                </p>
              </div>
            </div>
          </div>
        ))}
        {consensus && (
          <div className="sticky bottom-6 left-0 right-0 z-30 animate-in zoom-in duration-300 px-6">
            <div className="max-w-2xl mx-auto bg-gray-950 text-white p-10 rounded-[3rem] shadow-2xl relative border border-amber-500/30">
              <button onClick={() => setConsensus(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20} /></button>
              <h4 className="font-black text-[10px] text-amber-500 uppercase tracking-[0.4em] mb-6 text-center">Écho du Consensus</h4>
              <p className="text-xl md:text-2xl font-serif italic text-center leading-relaxed">"{consensus}"</p>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-8 border-t border-gray-100 bg-white relative z-20">
        <div className="flex gap-4 items-center bg-gray-50 p-2.5 rounded-[2rem] border border-gray-100 focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-2xl transition-all">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Déposez votre parole citoyenne..."
            className="flex-1 bg-transparent outline-none px-6 py-4 text-lg text-gray-800 placeholder:text-gray-400 font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-gray-900 text-white p-5 rounded-2xl hover:bg-black transition-all shadow-xl disabled:opacity-20"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
