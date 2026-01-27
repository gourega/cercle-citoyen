
// @google/genai utility functions for CERCLE CITOYEN
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Fonction Griot utilisant la synthèse vocale native du navigateur.
 * Nettoie les balises Markdown pour éviter la lecture des symboles (*, #, etc).
 */
export function speakAsGriot(content: string) {
  if (!('speechSynthesis' in window)) {
    console.error("La synthèse vocale n'est pas supportée par ce navigateur.");
    return;
  }

  const cleanContent = content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#/g, '')
    .replace(/^- /gm, '')
    .replace(/\n/g, ' ');

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanContent);
  utterance.lang = 'fr-FR';
  utterance.pitch = 0.85;
  utterance.rate = 0.9;

  const voices = window.speechSynthesis.getVoices();
  const maleVoice = voices.find(v => v.lang.startsWith('fr') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('dani') || v.name.toLowerCase().includes('thomas')));
  if (maleVoice) utterance.voice = maleVoice;

  window.speechSynthesis.speak(utterance);
}

export async function analyzePollutionImage(base64Image: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const dataOnly = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: dataOnly } },
          { text: "Tu es le système expert 'Sentinelle Verte'. Analyse cette image de dégradation urbaine. Identifie précisément la nuisance. Propose un plan d'action de 3 points. Réponds UNIQUEMENT en JSON valide." }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING },
            sector: { type: Type.STRING },
            nature: { type: Type.STRING },
            status: { type: Type.STRING },
            description: { type: Type.STRING },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            insight: { type: Type.STRING }
          },
          required: ["city", "sector", "nature", "description", "actionPlan", "insight"]
        }
      }
    });
    let cleanJson = response.text.trim();
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanJson);
  } catch (e) { return null; }
}

export async function generateCleanVision(base64Image: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const dataOnly = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: dataOnly, mimeType: 'image/jpeg' } },
          { text: "Rénovation urbaine : retire les déchets, nettoie l'eau stagnante et remplace par un caniveau propre ou une bordure fleurie. Rends l'image lumineuse." }
        ]
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) { return null; }
}

export async function summarizeCircleDiscussions(circleType: string, posts: string[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Synthétise les discussions du cercle ${circleType} : ${posts.join('\n')}`,
    });
    return response.text;
  } catch (e) { return "Synthèse indisponible."; }
}

export async function findInitiatives(query: string, lat?: number, lng?: number) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const config: any = { tools: [{ googleMaps: {} }] };
    if (lat && lng) config.toolConfig = { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } };
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: `Cherche initiatives citoyennes : "${query}" en Côte d'Ivoire.`,
      config,
    });
    return { text: response.text || "Résultats identifiés.", places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (e) { return { text: "Erreur localisation.", places: [] }; }
}

export async function analyzeIdeaImpact(title: string, description: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyse l'impact de l'idée : ${title} - ${description}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            potentialImpact: { type: Type.STRING },
            neededExpertises: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["potentialImpact", "neededExpertises"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { potentialImpact: "Inconnu", neededExpertises: [] }; }
}

export async function analyzeCommunityReputation(entityName: string, vouches: string[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyse réputation de ${entityName} basée sur : ${vouches.join(' | ')}`,
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
    return JSON.parse(response.text || "{}");
  } catch (e) { return { score: 50, summary: "Erreur", strengths: [] }; }
}

export async function mediateChat(messages: {sender: string, text: string}[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Agis en médiateur sage pour cette discussion : ${messages.map(m => `${m.sender}: ${m.text}`).join('\n')}`,
    });
    return response.text;
  } catch (e) { return "Médiation hors-ligne."; }
}

export async function getConsensusSummary(messages: {sender: string, text: string}[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Quel consensus se dégage de ces échanges ? ${messages.map(m => m.text).join('\n')}`,
    });
    return response.text;
  } catch (e) { return "Consensus indisponible."; }
}

export async function simplifyLegalText(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Simplifie ce texte législatif ou administratif pour un citoyen ivoirien : ${text}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            impacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            alerts: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "impacts", "alerts"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return { summary: "Erreur", impacts: [], alerts: [] }; }
}

export async function generateImpactVisual(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `High quality visual for an Ivorian civic project: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } },
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("Image non générée");
  return `data:image/png;base64,${part.inlineData.data}`;
}
