import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

interface QuizAnswers {
  education: string;
  yearsExperience: string;
  age: string;
  englishLevel: string;
  hasJobOffer: string;
  fieldOfWork: string;
  savings: string;
}

export async function POST(req: NextRequest) {
  try {
    const { answers, destination, origin }: {
      answers: QuizAnswers;
      destination: string;
      origin: string;
    } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an immigration expert. Based on this person's profile, suggest the best visa options for moving from ${origin} to ${destination} for work.

PROFILE:
- Education: ${answers.education}
- Work Experience: ${answers.yearsExperience}
- Age Range: ${answers.age}
- English Level: ${answers.englishLevel}
- Has Job Offer: ${answers.hasJobOffer}
- Field of Work: ${answers.fieldOfWork}
- Savings Available: ${answers.savings}

Return a JSON array of 3-4 visa options, ranked by how well this person matches. Each visa should have:
- visaType: name of the visa
- matchScore: percentage 0-100 of how well they qualify
- description: one sentence about the visa
- requirements: array of 3 key requirements
- processingTime: typical processing time
- estimatedCost: cost range in USD

Return ONLY valid JSON array, no markdown or explanation.
Example: [{"visaType":"Skilled Worker","matchScore":80,"description":"...","requirements":["..."],"processingTime":"2-4 months","estimatedCost":"$2000-3000"}]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let visaOptions;
    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      visaOptions = JSON.parse(cleanedResponse);
    } catch {
      visaOptions = getDefaultVisaOptions(destination, answers);
    }

    return NextResponse.json({ visaOptions });
  } catch (error) {
    console.error("Visa eligibility error:", error);
    return NextResponse.json({
      visaOptions: getDefaultVisaOptions("your destination", {} as QuizAnswers),
    });
  }
}

function getDefaultVisaOptions(destination: string, answers: Partial<QuizAnswers>) {
  const hasJobOffer = answers.hasJobOffer === "yes";
  const isYoung = answers.age === "18-25" || answers.age === "26-35";
  const isHighlyEducated = answers.education === "masters" || answers.education === "phd";

  return [
    {
      visaType: "Skilled Worker Visa",
      matchScore: hasJobOffer ? 85 : 60,
      description: `Employer-sponsored work visa for ${destination}`,
      requirements: ["Job offer from licensed sponsor", "Meet salary threshold", "English proficiency"],
      processingTime: "2-4 months",
      estimatedCost: "$1,500 - $3,000",
    },
    {
      visaType: "Points-Based Skilled Visa",
      matchScore: isHighlyEducated ? 75 : 55,
      description: "Independent skilled migration without employer sponsorship",
      requirements: ["Skills assessment", "Points test (65+ points)", "IELTS or equivalent"],
      processingTime: "6-12 months",
      estimatedCost: "$4,000 - $5,500",
    },
    {
      visaType: "Working Holiday Visa",
      matchScore: isYoung ? 70 : 20,
      description: "Temporary work and travel visa for young adults",
      requirements: ["Age 18-30/35", "Proof of funds", "Health insurance"],
      processingTime: "1-3 weeks",
      estimatedCost: "$300 - $500",
    },
    {
      visaType: "Intra-Company Transfer",
      matchScore: 40,
      description: "Transfer within multinational company",
      requirements: ["12+ months with company", "Managerial/specialist role", "Continuing employment"],
      processingTime: "1-3 months",
      estimatedCost: "$1,000 - $2,000",
    },
  ];
}
