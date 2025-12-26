import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

interface StepContext {
  stepTitle: string;
  stepDescription: string;
  stepCategory: string;
  corridorOrigin: string;
  corridorDestination: string;
}

export async function POST(req: NextRequest) {
  try {
    const { stepContext }: { stepContext: StepContext } = await req.json();

    if (!stepContext) {
      return NextResponse.json(
        { error: "Missing step context" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `You are a migration document expert. Generate a checklist of documents needed for this migration step.

STEP: ${stepContext.stepTitle}
DESCRIPTION: ${stepContext.stepDescription}
CATEGORY: ${stepContext.stepCategory}
CORRIDOR: ${stepContext.corridorOrigin} → ${stepContext.corridorDestination}

Generate a JSON array of documents needed for this step. Each document should have:
- id: unique identifier (lowercase, hyphenated)
- name: document name
- description: brief description of what it is
- required: boolean (is it mandatory?)

Return ONLY a valid JSON array, no markdown, no explanation. Example format:
[{"id":"passport","name":"Valid Passport","description":"Current passport with at least 6 months validity","required":true}]

Generate 3-6 relevant documents for this specific step.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response
    let documents;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      documents = JSON.parse(cleanedResponse);
    } catch {
      // Fallback: generate default documents based on category
      documents = getDefaultDocuments(stepContext.stepCategory);
    }

    // Add completed: false to all documents
    const documentsWithStatus = documents.map((doc: { id: string; name: string; description?: string; required: boolean }) => ({
      ...doc,
      completed: false,
    }));

    return NextResponse.json({ documents: documentsWithStatus });
  } catch (error) {
    console.error("Document generation error:", error);

    // Return fallback documents on error
    return NextResponse.json({
      documents: getDefaultDocuments("general"),
      isFallback: true,
    });
  }
}

function getDefaultDocuments(category: string) {
  const defaults: Record<string, Array<{ id: string; name: string; description: string; required: boolean; completed: boolean }>> = {
    visa: [
      { id: "passport", name: "Valid Passport", description: "Current passport with at least 6 months validity", required: true, completed: false },
      { id: "photos", name: "Passport Photos", description: "Recent passport-sized photographs", required: true, completed: false },
      { id: "application-form", name: "Visa Application Form", description: "Completed visa application form", required: true, completed: false },
      { id: "bank-statements", name: "Bank Statements", description: "Last 3-6 months of bank statements", required: true, completed: false },
    ],
    finance: [
      { id: "bank-statements", name: "Bank Statements", description: "Proof of financial stability", required: true, completed: false },
      { id: "tax-returns", name: "Tax Returns", description: "Recent tax filing documents", required: false, completed: false },
      { id: "employment-letter", name: "Employment Letter", description: "Letter from employer confirming position and salary", required: false, completed: false },
    ],
    housing: [
      { id: "rental-agreement", name: "Rental Agreement", description: "Lease or rental contract", required: false, completed: false },
      { id: "proof-of-address", name: "Proof of Address", description: "Utility bill or bank statement showing address", required: true, completed: false },
      { id: "references", name: "Rental References", description: "References from previous landlords", required: false, completed: false },
    ],
    employment: [
      { id: "resume", name: "Resume/CV", description: "Updated resume or curriculum vitae", required: true, completed: false },
      { id: "certificates", name: "Educational Certificates", description: "Degree and certification documents", required: true, completed: false },
      { id: "work-experience", name: "Work Experience Letters", description: "Letters from previous employers", required: false, completed: false },
    ],
    health: [
      { id: "medical-records", name: "Medical Records", description: "Summary of medical history", required: false, completed: false },
      { id: "vaccination", name: "Vaccination Records", description: "Proof of required vaccinations", required: true, completed: false },
      { id: "health-insurance", name: "Health Insurance", description: "Health insurance documentation", required: false, completed: false },
    ],
    legal: [
      { id: "birth-certificate", name: "Birth Certificate", description: "Official birth certificate", required: true, completed: false },
      { id: "police-clearance", name: "Police Clearance", description: "Background check certificate", required: true, completed: false },
      { id: "marriage-certificate", name: "Marriage Certificate", description: "If applicable", required: false, completed: false },
    ],
    social: [
      { id: "id-photos", name: "ID Photos", description: "Photos for local ID applications", required: true, completed: false },
      { id: "emergency-contacts", name: "Emergency Contacts", description: "List of emergency contact information", required: false, completed: false },
    ],
    general: [
      { id: "passport", name: "Valid Passport", description: "Current passport with sufficient validity", required: true, completed: false },
      { id: "id-card", name: "National ID Card", description: "Government-issued identification", required: false, completed: false },
      { id: "photos", name: "Passport Photos", description: "Recent passport-sized photographs", required: true, completed: false },
    ],
  };

  return defaults[category] || defaults.general;
}
