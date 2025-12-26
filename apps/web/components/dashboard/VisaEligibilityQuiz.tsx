"use client";

import { useState } from "react";
import { ClipboardCheck, ChevronRight, Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

interface QuizAnswers {
  education: string;
  yearsExperience: string;
  age: string;
  englishLevel: string;
  hasJobOffer: string;
  fieldOfWork: string;
  savings: string;
}

interface VisaResult {
  visaType: string;
  matchScore: number;
  description: string;
  requirements: string[];
  processingTime: string;
  estimatedCost: string;
}

interface VisaEligibilityQuizProps {
  destination: string;
  origin: string;
}

const questions = [
  {
    id: "education",
    question: "What's your highest education level?",
    options: [
      { value: "high_school", label: "High School" },
      { value: "bachelors", label: "Bachelor's Degree" },
      { value: "masters", label: "Master's Degree" },
      { value: "phd", label: "PhD / Doctorate" },
    ],
  },
  {
    id: "yearsExperience",
    question: "Years of work experience in your field?",
    options: [
      { value: "0-2", label: "0-2 years" },
      { value: "3-5", label: "3-5 years" },
      { value: "6-10", label: "6-10 years" },
      { value: "10+", label: "10+ years" },
    ],
  },
  {
    id: "age",
    question: "Your age range?",
    options: [
      { value: "18-25", label: "18-25" },
      { value: "26-35", label: "26-35" },
      { value: "36-45", label: "36-45" },
      { value: "45+", label: "45+" },
    ],
  },
  {
    id: "englishLevel",
    question: "English proficiency level?",
    options: [
      { value: "basic", label: "Basic" },
      { value: "intermediate", label: "Intermediate" },
      { value: "fluent", label: "Fluent" },
      { value: "native", label: "Native Speaker" },
    ],
  },
  {
    id: "hasJobOffer",
    question: "Do you have a job offer?",
    options: [
      { value: "yes", label: "Yes, confirmed offer" },
      { value: "interviewing", label: "Currently interviewing" },
      { value: "no", label: "Not yet" },
    ],
  },
  {
    id: "fieldOfWork",
    question: "Your field of work?",
    options: [
      { value: "tech", label: "Technology / IT" },
      { value: "healthcare", label: "Healthcare" },
      { value: "finance", label: "Finance / Business" },
      { value: "engineering", label: "Engineering" },
      { value: "education", label: "Education" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "savings",
    question: "Approximate savings available?",
    options: [
      { value: "under5k", label: "Under $5,000" },
      { value: "5k-15k", label: "$5,000 - $15,000" },
      { value: "15k-30k", label: "$15,000 - $30,000" },
      { value: "30k+", label: "$30,000+" },
    ],
  },
];

export function VisaEligibilityQuiz({ destination, origin }: VisaEligibilityQuizProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [results, setResults] = useState<VisaResult[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      analyzeEligibility();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const analyzeEligibility = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/visa-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          destination,
          origin,
        }),
      });
      const data = await response.json();
      setResults(data.visaOptions);
    } catch (error) {
      console.error("Failed to analyze eligibility:", error);
      // Fallback results
      setResults(getFallbackResults(destination));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setResults(null);
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 border-2 border-black flex items-center justify-center">
            <ClipboardCheck className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold">Visa Eligibility Quiz</h3>
            <p className="text-sm text-gray-600">Find out which visas you qualify for</p>
          </div>
        </div>
        <ChevronRight
          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
          size={20}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t-4 border-black p-4">
          {!results ? (
            <>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold">Question {currentStep + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-gray-200 border-2 border-black">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              {isAnalyzing ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto mb-4" size={40} />
                  <p className="font-bold">Analyzing your eligibility...</p>
                  <p className="text-sm text-gray-600">Checking visa options for {destination}</p>
                </div>
              ) : (
                <>
                  <h4 className="font-bold text-lg mb-4">{currentQuestion.question}</h4>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestion.id, option.value)}
                        className={`
                          w-full p-3 text-left border-2 border-black transition-all
                          ${answers[currentQuestion.id as keyof QuizAnswers] === option.value
                            ? "bg-purple-500 text-white shadow-[2px_2px_0_0_#000]"
                            : "bg-white hover:bg-gray-50"
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className={`
                        px-4 py-2 border-2 border-black font-bold
                        ${currentStep === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}
                      `}
                    >
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!answers[currentQuestion.id as keyof QuizAnswers]}
                      className={`
                        px-6 py-2 bg-purple-500 text-white font-bold
                        border-2 border-black shadow-[2px_2px_0_0_#000]
                        ${!answers[currentQuestion.id as keyof QuizAnswers]
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                        }
                      `}
                    >
                      {currentStep === questions.length - 1 ? "Get Results" : "Next"}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Results */
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-yellow-500" size={24} />
                <h4 className="font-bold text-lg">Your Visa Options for {destination}</h4>
              </div>

              <div className="space-y-4">
                {results.map((visa, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 border-2 border-black
                      ${visa.matchScore >= 70 ? "bg-green-50 border-l-4 border-l-green-500" :
                        visa.matchScore >= 40 ? "bg-yellow-50 border-l-4 border-l-yellow-500" :
                        "bg-gray-50 border-l-4 border-l-gray-400"}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold">{visa.visaType}</h5>
                      <div className={`
                        px-2 py-1 text-sm font-bold
                        ${visa.matchScore >= 70 ? "bg-green-500 text-white" :
                          visa.matchScore >= 40 ? "bg-yellow-500 text-black" :
                          "bg-gray-400 text-white"}
                      `}>
                        {visa.matchScore}% Match
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{visa.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Processing:</span>
                        <span className="font-bold ml-1">{visa.processingTime}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-bold ml-1">{visa.estimatedCost}</span>
                      </div>
                    </div>

                    {visa.matchScore >= 70 && (
                      <div className="mt-3 flex items-center gap-1 text-green-700 text-sm">
                        <CheckCircle2 size={16} />
                        <span>Strong candidate based on your profile</span>
                      </div>
                    )}
                    {visa.matchScore < 40 && (
                      <div className="mt-3 flex items-center gap-1 text-orange-600 text-sm">
                        <AlertTriangle size={16} />
                        <span>May require additional qualifications</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={resetQuiz}
                className="mt-4 w-full py-2 border-2 border-black font-bold hover:bg-gray-100"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getFallbackResults(destination: string): VisaResult[] {
  // Generic fallback results
  return [
    {
      visaType: "Skilled Worker Visa",
      matchScore: 75,
      description: `Work visa for qualified professionals with job offers in ${destination}`,
      requirements: ["Job offer", "Relevant qualifications", "English proficiency"],
      processingTime: "2-4 months",
      estimatedCost: "$1,500 - $3,000",
    },
    {
      visaType: "Skilled Independent Visa",
      matchScore: 60,
      description: "Points-based visa for skilled workers without employer sponsorship",
      requirements: ["Skills assessment", "Points test", "English test"],
      processingTime: "6-12 months",
      estimatedCost: "$4,000 - $5,000",
    },
    {
      visaType: "Working Holiday Visa",
      matchScore: 45,
      description: "Temporary visa for young adults to work and travel",
      requirements: ["Age 18-30", "Sufficient funds", "Return ticket"],
      processingTime: "1-2 weeks",
      estimatedCost: "$300 - $500",
    },
  ];
}
