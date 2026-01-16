
// @google/genai utility functions for CERCLE CITOYEN
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY manquante. Fonctionnement en mode dégradé.");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

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

export async function analyzePollutionImage(base64Image: string) {
  try {
    const ai = getAI();
    if (!ai) return null;
    
    // Nettoyage de la chaîne base64
    const dataOnly = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: dataOnly } },
            { text: "Analyse cette pollution en Côte d'Ivoire. Retourne UNIQUEMENT un objet JSON avec les clés suivantes : city, sector, nature, status, description, actionPlan (array), insight." }
          ]
        }
      ],
      config: { 
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.trim() || "{}";
    // Nettoyage manuel si l'IA ajoute des balises markdown ```json
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) { 
    console.error("Erreur Analyse Pollution:", e);
    return null; 
  }
}

export async function generateCleanVision(base64Image: string) {
  try {
    const ai = getAI();
    if (!ai) return null;
    
    const dataOnly = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: dataOnly, mimeType: 'image/jpeg' } },
          { text: "Transforme ce site pollué en espace urbain propre, verdoyant et exemplaire pour la Côte d'Ivoire." }
        ]
      }
    });
    
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) { 
    console.error("Erreur Clean Vision:", e);
    return null; 
  }
}

export async function getGriotReading(content: string) {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Lis avec sagesse : ${content}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) { return null; }
}

export async function summarizeCircleDiscussions(circleType: string, posts: string[]) {
  try {
    const ai = getAI();
    if (!ai) return "Intelligence indisponible.";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Synthétise les discussions du cercle ${circleType} : ${posts.join('\n')}`,
    });
    return response.text;
  } catch (e) { return "Synthèse indisponible."; }
}

export async function findInitiatives(query: string, lat?: number, lng?: number) {
  try {
    const ai = getAI();
    if (!ai) return { text: "Recherche indisponible.", places: [] };
    const config: any = { tools: [{ googleMaps: {} }] };
    if (lat && lng) {
      config.toolConfig = { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } };
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: `Cherche initiatives citoyennes : "${query}" en Côte d'Ivoire.`,
      config,
    });
    return {
      text: response.text || "Résultats identifiés.",
      places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) { return { text: "Erreur localisation.", places: [] }; }
}

export async function analyzeIdeaImpact(title: string, description: string) {
  try {
    const ai = getAI();
    if (!ai) return { potentialImpact: "Inconnu", neededExpertises: [] };
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse l'impact de l'idée : ${title} - ${description}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { potentialImpact: "Inconnu", neededExpertises: [] }; }
}

export async function analyzeCommunityReputation(entityName: string, vouches: string[]) {
  try {
    const ai = getAI();
    if (!ai) return { score: 50, summary: "Indisponible", strengths: [] };
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse réputation de ${entityName} basée sur : ${vouches.join(' | ')}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { score: 50, summary: "Erreur", strengths: [] }; }
}

export async function mediateChat(messages: {sender: string, text: string}[]) {
  try {
    const ai = getAI();
    if (!ai) return "Médiation hors-ligne.";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Agis en médiateur sage pour cette discussion : ${messages.map(m => `${m.sender}: ${m.text}`).join('\n')}`,
    });
    return response.text;
  } catch (e) { return "Médiation indisponible."; }
}

export async function getConsensusSummary(messages: {sender: string, text: string}[]) {
  try {
    const ai = getAI();
    if (!ai) return "Consensus indisponible.";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Quel consensus se dégage de ces échanges ? ${messages.map(m => m.text).join('\n')}`,
    });
    return response.text;
  } catch (e) { return "Consensus indisponible."; }
}

export async function simplifyLegalText(text: string) {
  try {
    const ai = getAI();
    if (!ai) return { summary: "Indisponible", impacts: [], alerts: [] };
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simplifie ce texte législatif ou administratif pour un citoyen ivoirien : ${text}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return { summary: "Erreur", impacts: [], alerts: [] }; }
}

export async function generateImpactVisual(prompt: string) {
  const ai = getAI();
  if (!ai) throw new Error("IA indisponible");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `High quality visual for an Ivorian civic project: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } },
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("Image non générée");
  return `data:image/png;base64,${part.inlineData.data}`;
}
