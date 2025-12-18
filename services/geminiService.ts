import { GoogleGenAI } from "@google/genai";
import { GameState } from "../types";
import { TOWER_STATS, MAPS } from "../constants";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getStrategicAdvice = async (gameState: GameState): Promise<string> => {
  const ai = getAIClient();
  if (!ai) {
    return "Aetherlink Offline: Neural conduit severed.";
  }

  const map = MAPS[gameState.mapId];
  const towerSummary = gameState.towers.map(t => {
    const conf = TOWER_STATS[t.type];
    const infusion = t.infusion ? `[${t.infusion}]` : "";
    return `${conf.name} Lvl${t.level} ${infusion}`;
  }).join(", ");

  const prompt = `
    You are the High Artificer of the Aetherforge.
    
    Mission Context:
    - Map: ${map.name} (${map.theme})
    - Modifiers: ${map.modifiers.join(", ")}
    - Threat Analysis: ${gameState.conductorAdaptation || "Analyzing..."}
    - Active Event: ${gameState.activeEvent || "None"}
    
    Status:
    - Wave: ${gameState.wave}
    - Gold: ${gameState.money}
    - Mana: ${Math.floor(gameState.mana)}
    - Defense (Toens): ${towerSummary || "Empty"}
    
    The enemy "Conductor AI" is adapting to the player's build. 
    Give a short, punchy tactical order (max 2 sentences) in a Steampunk Commander persona.
    Focus on countering the specific adaptive threat or map hazard.
    Refer to towers as "Toens".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Static received from command.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Aetherlink disrupted.";
  }
};