import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

interface CulturalProfile {
  originCulture: string;
  communicationStyle: string;
  familyStructure: string;
  timeOrientation: string;
  values: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      originCountryName,
      destinationCountryName,
      culturalProfile,
    } = body as {
      origin: string;
      destination: string;
      originCountryName: string;
      destinationCountryName: string;
      culturalProfile?: CulturalProfile;
    };

    if (!originCountryName || !destinationCountryName) {
      return NextResponse.json(
        { error: "Origin and destination country names required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const culturalContext = culturalProfile
      ? `
The user has completed a cultural profile interview:
- Origin Culture: ${culturalProfile.originCulture}
- Communication Style: ${culturalProfile.communicationStyle}
- Family Structure: ${culturalProfile.familyStructure}
- Time Orientation: ${culturalProfile.timeOrientation}
- Core Values: ${culturalProfile.values.join(", ")}

Use this personal profile to make the analysis more specific and accurate.
`
      : "";

    const prompt = `You are a cross-cultural psychologist and migration expert. Analyze the cultural bridge between ${originCountryName} and ${destinationCountryName} for someone relocating.

${culturalContext}

Return ONLY valid JSON with this exact structure:
{
  "dimensions": [
    {
      "dimension": "Communication Style",
      "origin": "brief label (e.g., 'Indirect, Context-Heavy')",
      "destination": "brief label (e.g., 'Direct, Explicit')",
      "originScore": <0-100 on a scale where 0=indirect/implicit, 100=direct/explicit>,
      "destinationScore": <0-100>,
      "insight": "One sentence explaining the difference",
      "adaptation": "Practical tip for adapting",
      "difficulty": "easy|moderate|challenging"
    }
  ],
  "overallCompatibility": <0-100 cultural compatibility score>,
  "keyAdaptations": ["3-4 most important behavioral changes needed"],
  "strengthsToLeverage": ["2-3 cultural strengths that will help them succeed"]
}

Include these 6 dimensions:
1. Communication Style (direct vs indirect)
2. Time Orientation (punctuality, scheduling)
3. Hierarchy & Authority (flat vs hierarchical)
4. Individualism vs Collectivism
5. Work-Life Balance
6. Social Etiquette (greetings, personal space)

Be specific to these two countries. Use research-backed cultural frameworks (Hofstede, Meyer's Culture Map).
Base difficulty on how different the cultures are for that dimension.
The compatibility score should reflect overall cultural distance - higher means more similar.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse response");
    }

    const bridgeData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ...bridgeData,
      generatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Cultural bridge error:", error);

    // Return fallback data
    return NextResponse.json({
      dimensions: [
        {
          dimension: "Communication Style",
          origin: "Context-dependent",
          destination: "Direct",
          originScore: 30,
          destinationScore: 80,
          insight: "Your destination culture values explicit communication",
          adaptation: "Be more direct in stating your needs and opinions",
          difficulty: "moderate",
        },
        {
          dimension: "Time Orientation",
          origin: "Flexible",
          destination: "Punctual",
          originScore: 40,
          destinationScore: 90,
          insight: "Punctuality is taken very seriously",
          adaptation: "Always arrive 5 minutes early for appointments",
          difficulty: "moderate",
        },
        {
          dimension: "Hierarchy",
          origin: "Hierarchical",
          destination: "Egalitarian",
          originScore: 75,
          destinationScore: 30,
          insight: "Workplace structures are flatter than you may be used to",
          adaptation: "Feel comfortable sharing ideas directly with leadership",
          difficulty: "easy",
        },
      ],
      overallCompatibility: 65,
      keyAdaptations: [
        "Adapt to more direct communication",
        "Prioritize punctuality",
        "Build individual relationships over group connections",
      ],
      strengthsToLeverage: [
        "Strong family values translate to team loyalty",
        "Respect for elders shows professionalism",
      ],
      generatedAt: Date.now(),
    });
  }
}
