import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

interface CulturalProfile {
  originCulture: string;
  communicationStyle: string;
  familyStructure: string;
  timeOrientation: string;
  values: string[];
  foodDietary: string[];
  celebrations: string[];
}

interface CulturalCardData {
  originCulture: string;
  greetingCustoms: string;
  communicationTips: string[];
  foodTraditions: string;
  importantHolidays: string[];
  whatToKnow: string;
}

export async function POST(req: NextRequest) {
  try {
    const profile: CulturalProfile = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a cultural anthropologist creating a shareable cultural card that helps others understand someone's cultural background. Based on the following cultural profile, generate content for a cultural card that can be shared with neighbors, coworkers, and community members.

CULTURAL PROFILE:
- Origin Culture: ${profile.originCulture}
- Communication Style: ${profile.communicationStyle}
- Family Structure: ${profile.familyStructure}
- Time Orientation: ${profile.timeOrientation}
- Core Values: ${profile.values.join(", ")}
- Food/Dietary Preferences: ${profile.foodDietary.join(", ")}
- Celebrations: ${profile.celebrations.join(", ")}

Generate a cultural card with the following sections. Be warm, educational, and help bridge cultural understanding. Keep each section concise but informative.

Respond in JSON format with this structure:
{
  "originCulture": "The culture name (e.g., 'Nigerian Yoruba Culture')",
  "greetingCustoms": "2-3 sentences about how people from this culture typically greet others, including any important gestures or phrases",
  "communicationTips": ["3-4 short tips for communicating effectively with someone from this culture"],
  "foodTraditions": "2-3 sentences about food customs, hospitality, and any dietary considerations",
  "importantHolidays": ["4-6 important holidays or celebrations"],
  "whatToKnow": "2-3 sentences summarizing the most important things to understand about this culture for building positive relationships"
}

Respond ONLY with valid JSON, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const cardData: CulturalCardData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(cardData);
  } catch (error) {
    console.error("Error generating cultural card:", error);
    return NextResponse.json(
      { error: "Failed to generate cultural card" },
      { status: 500 }
    );
  }
}
