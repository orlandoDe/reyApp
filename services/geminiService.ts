import { GoogleGenAI, Type } from "@google/genai";
import { AiDiagnosisResponse } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeDroneIssue = async (
  model: string,
  issueDescription: string
): Promise<AiDiagnosisResponse | null> => {
  try {
    const ai = getAI();
    if (!ai) return null;

    const prompt = `
      You are an expert drone technician. 
      Drone Model: ${model}
      Reported Issue: ${issueDescription}
      
      Provide a technical diagnosis. 
      Return JSON with:
      - likelyIssue (short summary)
      - recommendedActions (list of 3 steps)
      - estimatedDifficulty (Low, Medium, or High)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            likelyIssue: { type: Type.STRING },
            recommendedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedDifficulty: {
              type: Type.STRING,
              enum: ["Low", "Medium", "High"]
            },
          },
          required: ["likelyIssue", "recommendedActions", "estimatedDifficulty"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AiDiagnosisResponse;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return null;
  }
};

export const generateClientUpdateMessage = async (
  customerName: string,
  droneModel: string,
  status: string
): Promise<string> => {
  try {
    const ai = getAI();
    if (!ai) return `Your ${droneModel} status has been updated to: ${status}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a short, professional SMS notification for ${customerName} regarding their ${droneModel}. 
      The current status is: ${status}. Keep it under 160 characters. Friendly tone.`,
    });
    return response.text || "Status update available.";
  } catch (error) {
    return `Your ${droneModel} status has been updated to: ${status}.`;
  }
};
