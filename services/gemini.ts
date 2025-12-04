import { GoogleGenAI } from "@google/genai";
import { SummaryTone, VoiceName } from "../types";
import { base64ToUint8Array, pcmToWav } from "../utils/audio";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generateSummaryScript = async (text: string, tone: SummaryTone): Promise<string> => {
  const ai = getClient();
  
  let toneInstruction = "";
  switch (tone) {
    case SummaryTone.PROFESSIONAL:
      toneInstruction = "Keep the tone professional, objective, and clear. Like a standard news broadcast.";
      break;
    case SummaryTone.CASUAL:
      toneInstruction = "Keep the tone conversational, friendly, and accessible. Like a podcast host explaining it to a friend.";
      break;
    case SummaryTone.WITTY:
      toneInstruction = "Add a touch of wit and cleverness, but keep the facts accurate. Entertaining but informative.";
      break;
    case SummaryTone.BRIEF:
      toneInstruction = "Be extremely concise. Bullet-point style delivery converted to full sentences. Get to the point immediately.";
      break;
  }

  const prompt = `
    You are an expert news scriptwriter. 
    Convert the following raw article text into a spoken-word script suitable for a text-to-speech engine.
    
    GUIDELINES:
    - The output MUST be plain text.
    - Remove valid URLS, citations, or visual descriptions not suitable for audio.
    - ${toneInstruction}
    - Keep the length under 250 words unless the article is very long, but aim for a 1-2 minute listen.
    - Do not include "Voiceover:" or "Narrator:" prefixes. Just the script.
    
    ARTICLE TEXT:
    ${text}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Could not generate summary.";
};

export const generateSpeechFromText = async (script: string, voice: VoiceName): Promise<string> => {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const candidate = response.candidates?.[0];
  const base64Audio = candidate?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    console.error("Gemini TTS Error. Full response:", response);
    
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`Generation stopped due to: ${candidate.finishReason}`);
    }
    
    throw new Error("No audio data returned from Gemini. The model may have failed to generate audio for this text.");
  }

  // Convert raw PCM base64 -> Uint8Array -> WAV Blob -> Blob URL
  const pcmData = base64ToUint8Array(base64Audio);
  const wavBlob = pcmToWav(pcmData, 24000); // 24kHz is standard for this model
  return URL.createObjectURL(wavBlob);
};