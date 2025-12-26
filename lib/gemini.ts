
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix for missing decodeBase64Audio
export function decodeBase64Audio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fix for missing decodeAudioBuffer
export async function decodeAudioBuffer(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export async function getGriotReading(content: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Lis ceci avec une voix posée et inspirante : ${content}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

// Fix for missing summarizeCircleDiscussions
export async function summarizeCircleDiscussions(circleType: string, posts: string[]) {
  const ai = getAI();
  const context = posts.join('\n---\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `En tant qu'IA du Cercle, résume les discussions récentes du cercle "${circleType}". Souligne les points clés et les initiatives suggérées :\n\n${context}`,
  });
  return response.text;
}

// Fix for missing generateWisdomEcho
export async function generateWisdomEcho(circleType: string, summary: string) {
  const ai = getAI();
  const prompt = `Voici une synthèse des discussions du cercle ${circleType}. Récite-la avec une sagesse ancestrale et encourageante : ${summary}`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export async function analyzeDiscussion(messages: { sender: string; text: string }[]) {
  const ai = getAI();
  const context = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `En tant qu'Esprit du Gardien, synthétise cette palabre citoyenne et propose une voie de consensus : \n${context}`,
    config: {
      thinkingConfig: { thinkingBudget: 1000 }
    }
  });
  return response.text;
}

// Fix for missing generateImpactVisual
export async function generateImpactVisual(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A professional, inspiring, and cinematic high-quality visualization of this citizen project impact: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateMobilizationVideo(prompt: string) {
  // Check for API key and open selection dialog if not present
  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) await window.aistudio.openSelectKey();

  // Create a new instance right before the call to ensure the latest API key is used
  const ai = getAI();

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `A cinematic mobilization video about ${prompt}, high quality, realistic, inspiring lighting.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
}

export async function findInitiatives(query: string, lat?: number, lng?: number) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Quelles sont les initiatives citoyennes ou ONGs locales liées à "${query}" ?`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat || 5.3484,
            longitude: lng || -4.0305
          }
        }
      }
    },
  });
  return {
    text: response.text,
    places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

// Fix for missing simplifyLegalText
export async function simplifyLegalText(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse et simplifie ce texte législatif ou document complexe :\n\n${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Résumé simple en 2 phrases" },
          impacts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste d'impacts concrets pour le citoyen" },
          alerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Points de vigilance" }
        },
        required: ["summary", "impacts", "alerts"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

// Fix for missing analyzeCommunityReputation
export async function analyzeCommunityReputation(name: string, vouches: string[]) {
  const ai = getAI();
  const context = vouches.join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse la réputation communautaire de "${name}" basée sur ces témoignages :\n\n${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "summary", "highlights"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

// Fix for missing mediateChat
export async function mediateChat(context: { sender: string; text: string }[]) {
  const ai = getAI();
  const conversation = context.map(m => `${m.sender}: ${m.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `En tant que médiateur du Cercle, intervient avec sagesse dans cette conversation pour maintenir le respect et l'objectif commun :\n\n${conversation}`,
  });
  return response.text;
}

// Fix for missing getConsensusSummary
export async function getConsensusSummary(context: { sender: string; text: string }[]) {
  const ai = getAI();
  const conversation = context.map(m => `${m.sender}: ${m.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Synthétise les points d'accord de cette palabre et propose une conclusion consensuelle :\n\n${conversation}`,
  });
  return response.text;
}

// Fix for missing verifyQuestAction
export async function verifyQuestAction(base64Image: string, questDescription: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: `Analyse si cette image prouve la réalisation de la quête suivante : "${questDescription}".` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING }
        },
        required: ["isValid", "explanation"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

// Fix for missing analyzeIdeaImpact
export async function analyzeIdeaImpact(title: string, description: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse l'impact potentiel de cette idée citoyenne :\n\nTitre: ${title}\nDescription: ${description}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          impactScore: { type: Type.NUMBER },
          neededExpertises: { type: Type.ARRAY, items: { type: Type.STRING } },
          strategicAdvice: { type: Type.STRING }
        },
        required: ["impactScore", "neededExpertises", "strategicAdvice"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}
