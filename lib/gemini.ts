
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY manquante dans l'environnement");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * AUDIO UTILS - Standardized for PCM Streaming
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
  // Correction : Utilisation de data.byteOffset et data.byteLength pour un accès précis au buffer
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Conversion PCM 16-bit vers Float32 compatible AudioContext
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * GRIOT (TTS) - Transformation de texte en parole de sage
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
 * WISDOM ECHO - TTS pour les synthèses de cercle
 */
export async function generateWisdomEcho(circleType: string, summary: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `En tant qu'esprit du cercle ${circleType}, récite cette synthèse avec sagesse : ${summary}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error("Wisdom Echo Error:", e);
    return null;
  }
}

/**
 * SUMMARIZER - Synthèse des discussions de cercle
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
 * ANCRAGE TERRITORIAL - Recherche avec Google Maps Grounding
 */
export async function findInitiatives(query: string, lat?: number, lng?: number) {
  try {
    const ai = getAI();
    const config: any = {
      tools: [{ googleMaps: {} }],
    };
    if (lat && lng) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: `Localise des initiatives citoyennes, ONG, mairies ou lieux d'action collective en Côte d'Ivoire liés à : "${query}". Si aucun lieu exact n'est trouvé, propose des conseils pour mobiliser sur ce sujet en Côte d'Ivoire.`,
      config,
    });

    const places = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text || "Voici les ressources territoriales identifiées pour votre action.",
      places: places
    };
  } catch (e) {
    console.error("Maps Grounding Error:", e);
    return { 
      text: "La recherche territoriale rencontre une difficulté. Essayez d'être plus spécifique.", 
      places: [] 
    };
  }
}

/**
 * BOUSSOLE DES LOIS - Simplification de textes juridiques
 */
export async function simplifyLegalText(text: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Décrypte et simplifie ce texte juridique ou administratif pour un citoyen ivoirien :\n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Résumé simple de l'esprit du texte." },
            impacts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Points concrets changeant la vie du citoyen."
            },
            alerts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Vigilances ou obligations à noter."
            }
          },
          propertyOrdering: ["summary", "impacts", "alerts"]
        }
      }
    });
    return JSON.parse(response.text || '{"summary": "Erreur d\'analyse", "impacts": [], "alerts": []}');
  } catch (e) {
    console.error("Legal Analysis Error:", e);
    return { summary: "Le Gardien n'a pas pu décrypter ce texte.", impacts: [], alerts: [] };
  }
}

/**
 * RÉPUTATION COMMUNAUTAIRE - Analyse de sentiment et traits
 */
export async function analyzeCommunityReputation(userName: string, vouches: string[]) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse la réputation citoyenne de ${userName} basée sur ces témoignages :\n\n${vouches.join('\n')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score de confiance global (0-100)." },
            analysis: { type: Type.STRING, description: "Synthèse de la réputation." },
            keyTraits: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Qualités citoyennes identifiées." 
            }
          },
          propertyOrdering: ["score", "analysis", "keyTraits"]
        }
      }
    });
    return JSON.parse(response.text || '{"score": 0, "analysis": "Indisponible", "keyTraits": []}');
  } catch (e) {
    console.error("Reputation Error:", e);
    return { score: 0, analysis: "Erreur lors de l'audit de réputation.", keyTraits: [] };
  }
}

/**
 * MÉDIATION DE PALABRE - Intervient dans le chat
 */
export async function mediateChat(messages: {sender: string, text: string}[]) {
  try {
    const ai = getAI();
    const chatStr = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Agis en médiateur sage pour ce dialogue citoyen. Apporte une perspective de cohésion ou une question de réflexion :\n\n${chatStr}`,
    });
    return response.text;
  } catch (e) {
    console.error("Mediation Error:", e);
    return "La sagesse du Gardien veille sur vous.";
  }
}

/**
 * CONSENSUS - Résumé de discussion
 */
export async function getConsensusSummary(messages: {sender: string, text: string}[]) {
  try {
    const ai = getAI();
    const chatStr = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identifie le consensus ou les points d'accord majeurs de cette palabre :\n\n${chatStr}`,
    });
    return response.text;
  } catch (e) {
    console.error("Consensus Error:", e);
    return "L'unité se cherche encore.";
  }
}

/**
 * VÉRIFICATION DE QUÊTE - Analyse d'image multi-modale
 */
export async function verifyQuestAction(base64Image: string, questDescription: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: `Analyse si cette image prouve la réalisation de la mission citoyenne suivante : "${questDescription}". Sois rigoureux.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN, description: "Vrai si l'action est prouvée." },
            explanation: { type: Type.STRING, description: "Commentaire court du Gardien." }
          },
          propertyOrdering: ["isValid", "explanation"]
        }
      }
    });
    return JSON.parse(response.text || '{"isValid": false, "explanation": "Analyse impossible."}');
  } catch (e) {
    console.error("Quest Verification Error:", e);
    return { isValid: false, explanation: "Le Gardien n'a pas pu valider la preuve visuelle." };
  }
}

/**
 * ANALYSE D'IMPACT D'IDÉE - Analyse de vision
 */
export async function analyzeIdeaImpact(title: string, description: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Évalue le potentiel de cette idée citoyenne :\nTitre : ${title}\nDescription : ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            impactScore: { type: Type.NUMBER, description: "Score de 0 à 100." },
            neededExpertises: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Expertises à mobiliser."
            },
            advice: { type: Type.STRING, description: "Un conseil pour passer à l'action." }
          },
          propertyOrdering: ["impactScore", "neededExpertises", "advice"]
        }
      }
    });
    return JSON.parse(response.text || '{"impactScore": 0, "neededExpertises": [], "advice": "Erreur d\'analyse."}');
  } catch (e) {
    console.error("Idea Analysis Error:", e);
    return { impactScore: 0, neededExpertises: [], advice: "Une erreur est survenue lors de l'analyse." };
  }
}

/**
 * VISUAL STUDIO - Génération d'images d'impact
 */
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
