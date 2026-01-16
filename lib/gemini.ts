
// @google/genai utility functions for CERCLE CITOYEN
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) return null;
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
    
    const dataOnly = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: dataOnly } },
            { text: "Tu es le système expert 'Sentinelle Verte' pour la Côte d'Ivoire. Analyse cette image de dégradation urbaine. Cela peut être des ordures, des eaux usées, ou des encombrants comme des véhicules vétustes abandonnés (épaves). Si la localisation exacte n'est pas visible, utilise 'Localité à préciser'. Identifie la nature exacte (ex: Véhicule hors d'usage et dépôts sauvages) et propose un plan d'action pour libérer l'espace public." }
          ]
        }
      ],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING, description: "Ville ou 'Localité à préciser'" },
            sector: { type: Type.STRING, description: "Quartier ou 'Secteur à préciser'" },
            nature: { type: Type.STRING, description: "Type de nuisance identifiée précisément" },
            status: { type: Type.STRING, description: "Urgence : reported ou critical" },
            description: { type: Type.STRING, description: "Description de l'obstruction ou pollution" },
            actionPlan: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 étapes concrètes de résolution" 
            },
            insight: { type: Type.STRING, description: "Une parole de sagesse sur le cadre de vie et la responsabilité" }
          },
          required: ["city", "sector", "nature", "description", "actionPlan", "insight"]
        }
      }
    });

    if (!response.text) throw new Error("Réponse vide");
    return JSON.parse(response.text);
  } catch (e) { 
    console.error("Erreur Analyse Pollution:", e);
    // Fallback structuré pour éviter le crash UI
    return {
      city: "Localité à préciser",
      sector: "Secteur à préciser",
      nature: "Encombrant / Nuisance identifiée",
      description: "L'image présente une anomalie urbaine nécessitant une intervention de salubrité.",
      actionPlan: ["Identifier le propriétaire s'il s'agit d'un véhicule", "Alerter les services municipaux", "Dégager l'espace public"],
      insight: "La propreté de la cité commence au pas de notre porte.",
      status: "reported"
    };
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
          { text: "Agis comme un architecte paysagiste urbain. Sur cette photo, retire tous les éléments de pollution, les déchets et surtout les véhicules abandonnés ou épaves. Remplace-les par un trottoir propre, des plantes tropicales ou un petit espace de repos citoyen. L'image doit être lumineuse et inspirante." }
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
