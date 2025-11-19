import { GoogleGenAI } from "@google/genai";
import { Enemy } from '../types';

// Initialize strictly with env variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEnemyFlavor = async (enemy: Enemy, location: string): Promise<string> => {
  try {
    const prompt = `Describe a menacing ${enemy.name} (Level ${enemy.level}) encountered in the ${location} of ancient Rome. Keep it under 20 words. Brutal and atmospheric.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `A wild ${enemy.name} appears!`;
  }
};

export const generateCombatSummary = async (logSummary: string, won: boolean): Promise<string> => {
  try {
    const prompt = `Summarize this gladiator fight in 2 sentences. The player ${won ? 'won' : 'lost'}. Use Roman terminology.
    Log summary: ${logSummary}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    return won ? "Victory is yours!" : "You have fallen in battle.";
  }
};

export const generateDynamicQuestName = async (level: number): Promise<string> => {
   try {
    const prompt = `Generate a short, epic name for a gladiator expedition quest (Level ${level}). No quotes.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch {
    return "The Dark Forest";
  }
}

export const getOracleWisdom = async (): Promise<string> => {
    try {
        const prompt = "You are the Oracle of Delphi. Give a short, cryptic, but encouraging prophecy to a gladiator seeking glory. Under 30 words.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch {
        return "The fates are clouded today.";
    }
}

export const generateChatResponse = async (playerMessage: string, playerName: string): Promise<string[]> => {
    try {
        const prompt = `You are simulating a global chat room for an online RPG set in Ancient Rome. 
        The player '${playerName}' just said: "${playerMessage}".
        Generate 2 distinct, short (under 15 words) responses from other fictional players (e.g., 'Spartacus99', 'RomeLover', 'Cesar_Salad'). 
        Format: "Username: Message". Do not add numbering.
        Make them sound like gamers roleplaying slightly, or just casual chat.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text.split('\n').filter(line => line.includes(':'));
    } catch {
        return ["System: The chat spirits are quiet."];
    }
}