import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY manquante");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * AUDIO UTILS
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
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

/**
 * GRIOT (TTS)
 */
export async function getGriotReading(content: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Lis ceci avec une voix de sage ivoirien, posée et inspirante : ${content}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
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

export async function generateWisdomEcho(circleType: string, summary: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Donne un écho de sagesse solennel sur ce résumé du cercle ${circleType} : ${summary}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
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
 * VISUAL STUDIO
 */
export async function generateImpactVisual(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Cinematic visual of citizen impact in Ivory Coast: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } },
  });
  
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("Image non générée");
  return `data:image/png;base64,${part.inlineData.data}`;
}

/**
 * ANALYTICS & TOOLS
 */
export async function findInitiatives(query: string, lat?: number, lng?: number) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Trouve les initiatives citoyennes réelles pour : "${query}" en Côte d'Ivoire.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat || 5.34, longitude: lng || -4.03 } } }
    },
  });
  return { text: response.text, places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
}

export async function mediateChat(messages: { sender: string; text: string }[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Interviens avec sagesse dans ce dialogue :\n\n${messages.map(m => `${m.sender}: ${m.text}`).join('\n')}`,
    config: { thinkingConfig: { thinkingBudget: 1000 } }
  });
  return response.text;
}

export async function getConsensusSummary(messages: { sender: string; text: string }[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Résume le consensus de cette discussion :\n\n${messages.map(m => `${m.sender}: ${m.text}`).join('\n')}`,
  });
  return response.text;
}

export async function verifyQuestAction(base64Image: string, questDescription: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: `Vérifie si cette image valide la quête : "${questDescription}". Réponds en JSON avec isValid (bool) et explanation (string).` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { isValid: { type: Type.BOOLEAN }, explanation: { type: Type.STRING } },
        required: ["isValid", "explanation"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
}

export async function simplifyLegalText(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explique simplement ce texte juridique :\n\n${text}`,
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
}

export async function analyzeIdeaImpact(title: string, description: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse l'impact de l'idée : "${title} - ${description}"`,
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

export async function analyzeCommunityReputation(userName: string, vouches: string[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse la réputation de ${userName} basée sur ces témoignages :\n\n${vouches.join('\n')}`,
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