import { GoogleGenAI } from "@google/genai";
import { Player } from '../types';

let aiClient: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getOracleWisdom = async (player: Player): Promise<{ text: string, reward: string, delta: any }> => {
  if (!aiClient) {
    return {
      text: "The Oracle is silent (API Key missing).",
      reward: "Nothing happened.",
      delta: {}
    };
  }

  try {
    const prompt = `
      You are a wise ancient Arab mystic in a board game called 'Civilization of Sands'.
      The player '${player.name}' has landed on your tile.
      Their stats: Gold=${player.resources.gold}, Water=${player.resources.water}, Energy=${player.resources.energy}.
      
      Generate a short, cryptic but helpful piece of wisdom (max 20 words) and a random game effect.
      
      Return ONLY a JSON object with this structure:
      {
        "wisdom": "string",
        "effectDescription": "string",
        "resourceDelta": { "gold": number, "water": number }
      }
      
      The resourceDelta numbers can be positive (reward) or negative (penalty). Keep values between -50 and +100.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      text: data.wisdom || "The sands shift...",
      reward: data.effectDescription || "Fate is uncertain.",
      delta: data.resourceDelta || {}
    };

  } catch (error) {
    console.error("AI Error:", error);
    return {
      text: "The spirits are quiet today.",
      reward: "Gain 10 Gold.",
      delta: { gold: 10 }
    };
  }
};
