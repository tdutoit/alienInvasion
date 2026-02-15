
import { GoogleGenAI } from "@google/genai";

// Local fallbacks to maintain immersion when the API is rate-limited or offline
const FALLBACK_NARRATIVES = [
  "Local sensors detecting increased thermal activity in the sector.",
  "Human transmission frequencies shifting to emergency bands.",
  "Mothership stealth systems operating at peak efficiency.",
  "Orbital data streams fragmented. Autonomous logic engaged.",
  "Biological signatures in the target zone showing elevated stress levels.",
  "Planetary defense grid attempting to triangulate our position.",
  "Human neural networks reacting to localized phenomena.",
  "Quantum encryption holding. Signal interference detected.",
  "Observation: Primitive civilizations are surprisingly resilient.",
  "Data harvest in progress. Resource allocation optimized."
];

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // Increased to 6 seconds to be safer against 429s

export async function generateNarrative(event: string, awareness: number) {
  const now = Date.now();
  
  // Throttle requests locally to avoid hitting the 429 limit proactively
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    return getLocalFallback();
  }

  lastRequestTime = now;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Short update (max 10 words). Context: Earth invasion. Stealth: ${100 - awareness}%. Event: ${event}. Format: [Transmission] message.`,
      config: {
        temperature: 0.5,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text ?? getLocalFallback();
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.status === 429) {
      return `[SIGNAL JAMMED] ${getLocalFallback()}`;
    }
    return getLocalFallback();
  }
}

function getLocalFallback() {
  return FALLBACK_NARRATIVES[Math.floor(Math.random() * FALLBACK_NARRATIVES.length)];
}
