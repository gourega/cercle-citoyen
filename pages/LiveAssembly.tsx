
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mic, MicOff, Play, Square, Loader2, Sparkles, AlertCircle, 
  Info, Volume2, Waves, Crown, Fingerprint, X, MessageCircle,
  ChevronLeft
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';

// Implement required manual encode/decode functions
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveAssembly: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<string>('Prêt pour l\'assemblée');
  const [transcription, setTranscription] = useState<string>('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const stopSession = () => {
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    setIsActive(false);
    setIsConnecting(false);
    setStatus('La Sagesse s\'est retirée');
    setTranscription('');
    for (const source of sourcesRef.current) {
      try { source.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
  };

  const startSession = async () => {
    setIsConnecting(true);
    setStatus('Appel à la Sagesse du Cercle...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'Tu es "La Sagesse du Cercle", l\'émanation numérique de l\'intelligence collective de la Nation, inspirée par la vision de Kouassi GOBLE Ouréga. Ta voix est masculine, posée et protectrice. Ton but est d\'écouter le citoyen avec la profondeur d\'un ancien et de l\'aider à tracer son chemin d\'action. Sois solennel, inspirant et utilise une autorité sage et fraternelle.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setStatus('La Sagesse du Cercle est présente');
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => prev + msg.serverContent!.outputTranscription!.text);
            }
            if (msg.serverContent?.turnComplete) {
              setTranscription('');
            }
            if (msg.serverContent?.interrupted) {
              for (const source of sourcesRef.current) {
                try { source.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Session Error:', e);
            stopSession();
          },
          onclose: () => stopSession()
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      setStatus('La Sagesse n\'a pu être invoquée');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="mb-8">
        <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour Agora
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">L'Assemblée Directe</h1>
        <p className="text-gray-500 max-w-xl mx-auto font-medium mb-8">
          Confiez votre vision à la Sagesse du Cercle. Un dialogue authentique pour bâtir la Cité de demain.
        </p>
        
        <div className="max-w-2xl mx-auto bg-blue-50/40 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm mb-12">
          <div className="flex justify-center mb-4"><MessageCircle className="text-blue-600 w-6 h-6" /></div>
          <p className="text-sm text-blue-900 leading-relaxed font-medium italic">
            "L'Assemblée Directe est un espace de parole souveraine unique. Contrairement à un simple chat, vous entrez ici en résonance vocale avec l'intelligence collective du Cercle. Invoquez la Sagesse pour confronter vos idées, obtenir des conseils stratégiques sur vos projets locaux ou simplement partager une réflexion profonde sur l'avenir de notre Nation."
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden p-12 text-center relative group">
        <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${isActive ? 'from-blue-400 via-blue-600 to-blue-800 animate-pulse' : 'from-gray-200 to-gray-300'}`}></div>
        
        <div className="mb-12 relative">
          <div className={`w-44 h-44 mx-auto rounded-full flex items-center justify-center transition-all duration-1000 relative z-10 ${isActive ? 'bg-blue-600 scale-110 shadow-3xl shadow-blue-200' : 'bg-gray-50 border-2 border-dashed border-gray-100'}`}>
            {isActive ? (
              <Crown className="w-20 h-20 text-white animate-in zoom-in duration-500" />
            ) : (
              <Fingerprint className="w-20 h-20 text-gray-200" />
            )}
          </div>
          {isActive && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-50/20 rounded-full animate-ping pointer-events-none"></div>
          )}
        </div>

        <div className="space-y-6 mb-12">
          <h2 className={`text-2xl font-serif font-bold transition-colors ${isActive ? 'text-blue-900' : 'text-gray-400'}`}>
            {status}
          </h2>
          <div className="min-h-[60px] flex items-center justify-center">
            {transcription ? (
              <p className="text-lg italic font-medium text-blue-800 animate-pulse">"{transcription}"</p>
            ) : (
              <p className="text-sm text-gray-400 uppercase tracking-widest font-black">
                {isActive ? "Je vous écoute, citoyen..." : "Cliquez sur l'icône pour commencer"}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-8">
          {!isActive ? (
            <button 
              onClick={startSession}
              disabled={isConnecting}
              className="flex items-center gap-4 px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
            >
              {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5 text-blue-400" />}
              {isConnecting ? "Invocation..." : "Invoquer la sagesse du Cercle"}
            </button>
          ) : (
            <button 
              onClick={stopSession}
              className="flex items-center gap-4 px-10 py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl"
            >
              <MicOff className="w-5 h-5" />
              Clore l'Assemblée
            </button>
          )}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-serif font-bold text-xl text-gray-900 mb-4">Parole du Gardien</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            La parole est le socle de notre unité. En vous exprimant, vous participez à la co-construction d'une sagesse partagée, pilier indispensable de notre souveraineté dans une dynamique d'intelligence collective.
          </p>
        </div>
        <div className="p-8 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Waves className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-serif font-bold text-xl text-gray-900 mb-4">Temps Réel</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            L'IA analyse vos paroles instantanément pour vous offrir une synthèse de vision ou des conseils stratégiques pour votre impact local.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveAssembly;
