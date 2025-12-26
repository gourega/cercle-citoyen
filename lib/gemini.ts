
import { GoogleGenAI, Type, Modality } from "@google/genai";

// L'instance doit être créée avec l'API KEY du process
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Décodage Audio PCM
 */
export function decodeBase64Audio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

/**
 * GRIOT : Synthèse vocale inspirante
 */
export async function getGriotReading(content: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Lis ceci avec une voix posée, masculine et inspirante de vieux sage ivoirien : ${content}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Zephyr est parfait pour le Gardien
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

// Fix: Add summarizeCircleDiscussions to satisfy CirclePage.tsx
/**
 * CERCLE : Synthèse des discussions
 */
export async function summarizeCircleDiscussions(circleType: string, posts: string[]) {
  const ai = getAI();
  const content = posts.join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Synthétise les discussions suivantes du cercle "${circleType}" pour en extraire les points clés et les initiatives émergentes. Sois bref et inspirant :\n\n${content}`,
  });
  return response.text;
}

// Fix: Add generateWisdomEcho to satisfy CirclePage.tsx
/**
 * CERCLE : Écho de Sagesse (TTS)
 */
export async function generateWisdomEcho(circleType: string, summary: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `En tant qu'Esprit du Gardien, donne un écho de sagesse à cette synthèse du cercle ${circleType} : ${summary}` }] }],
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

/**
 * STUDIO : Vidéo de Mobilisation
 */
export async function generateMobilizationVideo(prompt: string) {
  // Vérification de la clé via l'interface du studio (nécessaire pour Veo)
  if (!(await window.aistudio.hasSelectedApiKey())) {
    await window.aistudio.openSelectKey();
  }

  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic mobilization video for a citizen project in Ivory Coast: ${prompt}. High quality, realistic, inspiring lighting, 720p.`,
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

// Fix: Add generateImpactVisual to satisfy ImpactStudio.tsx
/**
 * STUDIO : Génération visuelle d'impact
 */
export async function generateImpactVisual(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A cinematic, high-quality image showing social impact and citizen engagement in Ivory Coast: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      },
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString: string = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }
  throw new Error("No image generated");
}

/**
 * CARTOGRAPHIE : Grounding Google Maps
 */
export async function findInitiatives(query: string, lat?: number, lng?: number) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Identifie les initiatives citoyennes, ONGs ou infrastructures locales liées à : "${query}" en Côte d'Ivoire.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat || 5.3484, // Abidjan par défaut
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

// Fix: Add analyzeCommunityReputation to satisfy BusinessPortal.tsx
/**
 * RÉPUTATION : Analyse des témoignages communautaires
 */
export async function analyzeCommunityReputation(userName: string, vouches: string[]) {
  const ai = getAI();
  const content = vouches.join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse la réputation communautaire de "${userName}" basée sur ces témoignages :\n\n${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "summary", "strengths"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

/**
 * MÉDIATION : Analyse des Palabres
 */
export async function mediateChat(messages: { sender: string; text: string }[]) {
  const ai = getAI();
  const conversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `En tant que "L'Esprit du Gardien", intervient avec sagesse dans cette conversation citoyenne pour maintenir le respect, la paix et l'objectif de progrès commun :\n\n${conversation}`,
    config: {
      thinkingConfig: { thinkingBudget: 1000 }
    }
  });
  return response.text;
}

// Fix: Add getConsensusSummary to satisfy ChatPage.tsx
/**
 * CONSENSUS : Résumé des échanges
 */
export async function getConsensusSummary(messages: { sender: string; text: string }[]) {
  const ai = getAI();
  const conversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Détermine s'il y a un consensus ou une direction commune dans cette discussion et résume-le en une phrase inspirante :\n\n${conversation}`,
  });
  return response.text;
}

/**
 * ANALYSE : Simplification Légale (Boussole)
 */
export async function simplifyLegalText(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse et vulgarise ce texte législatif ivoirien pour un citoyen ordinaire :\n\n${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Résumé simple en 2 phrases" },
          impacts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 impacts concrets" },
          alerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Points de vigilance" }
        },
        required: ["summary", "impacts", "alerts"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

// Fix: Add verifyQuestAction to satisfy QuestsPage.tsx
/**
 * QUÊTES : Vérification d'action par image
 */
export async function verifyQuestAction(base64Image: string, questDescription: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `Vérifie si cette image prouve la réalisation de la quête citoyenne suivante : "${questDescription}". Réponds en JSON avec un booléen 'isValid' et une explication courte et encourageante.`,
        },
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

// Fix: Add analyzeIdeaImpact to satisfy IdeaBankPage.tsx
/**
 * IDÉES : Analyse d'impact d'une idée
 */
export async function analyzeIdeaImpact(title: string, description: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse l'impact potentiel de cette idée citoyenne : "${title} - ${description}". Identifie les expertises nécessaires pour la réaliser.`,
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
