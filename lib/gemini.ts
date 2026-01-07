
// @google/genai utility functions for CERCLE CITOYEN

import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY manquante dans l'environnement");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * AUDIO UTILS
 */
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
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

/**
 * ANALYSE ENVIRONNEMENTALE (SENTINELLE)
 */
export async function analyzePollutionImage(base64Image: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } },
            { text: `Tu es un expert environnemental en Côte d'Ivoire. Analyse cette image de pollution. 
              Fournis un JSON avec :
              - city: string (identifiée ou supposée)
              - sector: string (quartier)
              - nature: enum (Ménagers, Volumineux, Construction, Verts, Spéciaux)
              - status: string (état actuel)
              - description: string (courte)
              - actionPlan: string[] (3 étapes simples)
              - insight: string (conseil citoyen inspirant)` }
          ]
        }
      ],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Analysis Error:", e);
    return null;
  }
}

/**
 * CLEAN VISION (SENTINELLE)
 */
export async function generateCleanVision(base64Image: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/jpeg' } },
          { text: "Transforme ce site pollué en Côte d'Ivoire en un espace urbain idéal, propre, avec de la verdure et sans aucun déchet. Garde la structure des bâtiments." }
        ]
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) {
    return null;
  }
}

/**
 * GRIOT (TTS)
 */
export async function getGriotReading(content: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Lis ceci avec une voix de sage africain, posée et inspirante : ${content}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error("Griot Error:", e);
    return null;
  }
}

/**
 * SUMMARIZER
 */
export async function summarizeCircleDiscussions(circleType: string, posts: string[]) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Synthétise ces discussions du cercle "${circleType}" pour en extraire l'essence citoyenne :\n\n${posts.join('\n')}`,
    });
    return response.text;
  } catch (e) {
    console.error("Summarizer Error:", e);
    return "Synthèse indisponible pour le moment.";
  }
}

/**
 * MAPS GROUNDING
 */
export async function findInitiatives(query: string, lat?: number, lng?: number) {
  try {
    const ai = getAI();
    const config: any = { tools: [{ googleMaps: {} }] };
    if (lat && lng) {
      config.toolConfig = { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } };
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: `Localise des initiatives citoyennes liés à : "${query}" en Côte d'Ivoire.`,
      config,
    });
    return {
      text: response.text || "Résultats identifiés.",
      places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    return { text: "Erreur de localisation.", places: [] };
  }
}

export async function simplifyLegalText(text: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Décrypte ce texte juridique :\n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            impacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            alerts: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { summary: "Erreur", impacts: [], alerts: [] };
  }
}

export async function mediateChat(messages: {sender: string, text: string}[]) {
  try {
    const ai = getAI();
    const chatStr = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Agis en médiateur sage pour ce dialogue citoyen :\n\n${chatStr}`,
    });
    return response.text;
  } catch (e) {
    return "La sagesse du Gardien veille.";
  }
}

export async function getConsensusSummary(messages: {sender: string, text: string}[]) {
  try {
    const ai = getAI();
    const chatStr = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Quel est le consensus de cette discussion ?\n\n${chatStr}`,
    });
    return response.text;
  } catch (e) {
    return "L'unité se cherche.";
  }
}

// Fix: Added missing exported member analyzeIdeaImpact for IdeaBankPage
/**
 * IDEA IMPACT ANALYSIS
 */
export async function analyzeIdeaImpact(title: string, description: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{ text: `Analyse l'impact de cette idée citoyenne :\nTitre: ${title}\nDescription: ${description}` }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            potentialImpact: { type: Type.STRING },
            neededExpertises: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Idea Impact Error:", e);
    return { potentialImpact: "Inconnu", neededExpertises: [] };
  }
}

// Fix: Added missing exported member analyzeCommunityReputation for BusinessPortal
/**
 * REPUTATION ANALYSIS (BUSINESS)
 */
export async function analyzeCommunityReputation(entityName: string, vouches: string[]) {
  try {
    const ai = getAI();
    const vouchesStr = vouches.join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{ text: `Analyse la réputation communautaire de "${entityName}" basée sur ces témoignages :\n\n${vouchesStr}` }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Reputation Analysis Error:", e);
    return { score: 50, summary: "Analyse indisponible.", strengths: [] };
  }
}

export async function generateImpactVisual(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Cinematic visual of citizen impact in Ivory Coast: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } },
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("Image non générée");
  return `data:image/png;base64,${part.inlineData.data}`;
}
