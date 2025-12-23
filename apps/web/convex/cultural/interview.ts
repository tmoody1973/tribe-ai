"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  culturalBridge,
  buildInterviewPrompt,
  buildCompletionPrompt,
} from "../../agents/culturalBridge";

interface UserProfile {
  _id: Id<"users">;
  language?: string;
  originCountry?: string;
  destinationCountry?: string;
}

interface CulturalProfile {
  _id: Id<"culturalProfiles">;
  interviewResponses: Record<string, string>;
}

interface InterviewState {
  questionNumber: number;
  responses: Record<string, string>;
  currentQuestion: string;
  isComplete: boolean;
}

/**
 * Parse interview responses to extract structured profile data
 */
function parseProfileFromResponses(responses: Record<string, string>): {
  originCulture: string;
  communicationStyle: "direct" | "indirect" | "context-dependent";
  familyStructure: "nuclear" | "extended" | "multi-generational";
  timeOrientation: "monochronic" | "polychronic";
  values: string[];
  foodDietary: string[];
  celebrations: string[];
} {
  // Extract origin culture from first response
  const originResponse = responses["q1"] || responses["q2"] || "";
  const originCulture = originResponse.slice(0, 100) || "Not specified";

  // Analyze communication style
  const commResponse = (responses["q3"] || "").toLowerCase();
  let communicationStyle: "direct" | "indirect" | "context-dependent" = "context-dependent";
  if (commResponse.includes("direct") || commResponse.includes("openly") || commResponse.includes("straightforward")) {
    communicationStyle = "direct";
  } else if (commResponse.includes("indirect") || commResponse.includes("subtle") || commResponse.includes("hint")) {
    communicationStyle = "indirect";
  }

  // Analyze family structure
  const familyResponse = (responses["q4"] || "").toLowerCase();
  let familyStructure: "nuclear" | "extended" | "multi-generational" = "nuclear";
  if (familyResponse.includes("grandparent") || familyResponse.includes("generation") || familyResponse.includes("elders")) {
    familyStructure = "multi-generational";
  } else if (familyResponse.includes("extended") || familyResponse.includes("uncle") || familyResponse.includes("aunt") || familyResponse.includes("cousin")) {
    familyStructure = "extended";
  }

  // Analyze time orientation
  const timeResponse = (responses["q6"] || "").toLowerCase();
  let timeOrientation: "monochronic" | "polychronic" = "monochronic";
  if (timeResponse.includes("flexible") || timeResponse.includes("relaxed") || timeResponse.includes("approximate") || timeResponse.includes("not strict")) {
    timeOrientation = "polychronic";
  }

  // Extract values from q5
  const valuesResponse = responses["q5"] || "";
  const values = extractListItems(valuesResponse);

  // Extract dietary practices from q7
  const foodResponse = responses["q7"] || "";
  const foodDietary = extractListItems(foodResponse);

  // Extract celebrations from q8
  const celebResponse = responses["q8"] || "";
  const celebrations = extractListItems(celebResponse);

  return {
    originCulture,
    communicationStyle,
    familyStructure,
    timeOrientation,
    values: values.length > 0 ? values : ["Not specified"],
    foodDietary: foodDietary.length > 0 ? foodDietary : ["No specific practices"],
    celebrations: celebrations.length > 0 ? celebrations : ["Not specified"],
  };
}

/**
 * Extract list items from a response
 */
function extractListItems(text: string): string[] {
  // Split by common delimiters and clean up
  const items = text
    .split(/[,;]|\band\b|\n/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && item.length < 50)
    .slice(0, 5); // Limit to 5 items

  return items;
}

/**
 * Start a new cultural interview
 */
export const startInterview = action({
  args: {},
  handler: async (ctx): Promise<InterviewState> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = (await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    })) as UserProfile | null;

    if (!user) throw new Error("User not found");

    // Check for existing profile
    const existing = (await ctx.runQuery(
      internal.cultural.profile.getProfileInternal,
      { userId: user._id }
    )) as CulturalProfile | null;

    if (existing) {
      return {
        questionNumber: 0,
        responses: existing.interviewResponses || {},
        currentQuestion:
          "You already have a cultural profile. Would you like to update it? You can start a new interview to replace your existing profile.",
        isComplete: true,
      };
    }

    // Build prompt for first question
    const prompt = buildInterviewPrompt({
      language: user.language || "en",
      originCountry: user.originCountry || "your home country",
      destinationCountry: user.destinationCountry || "your destination",
      questionNumber: 1,
      previousResponses: {},
    });

    // Generate first question
    const result = await culturalBridge.generate(prompt);

    return {
      questionNumber: 1,
      responses: {},
      currentQuestion: result.text,
      isComplete: false,
    };
  },
});

/**
 * Continue the interview with the next question
 */
export const continueInterview = action({
  args: {
    previousAnswer: v.string(),
    questionNumber: v.number(),
    responses: v.any(), // Record<string, string>
  },
  handler: async (ctx, { previousAnswer, questionNumber, responses }): Promise<InterviewState> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = (await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    })) as UserProfile | null;

    if (!user) throw new Error("User not found");

    // Save previous answer
    const updatedResponses: Record<string, string> = {
      ...(responses as Record<string, string>),
      [`q${questionNumber}`]: previousAnswer,
    };

    // Check if interview is complete (10 questions)
    if (questionNumber >= 10) {
      // Parse responses into structured profile
      const profileData = parseProfileFromResponses(updatedResponses);

      // Save profile
      await ctx.runMutation(internal.cultural.profile.saveProfileInternal, {
        userId: user._id,
        ...profileData,
        interviewResponses: updatedResponses,
      });

      // Generate completion message
      const completionPrompt = buildCompletionPrompt(
        user.language || "en",
        updatedResponses
      );
      const result = await culturalBridge.generate(completionPrompt);

      return {
        questionNumber: questionNumber + 1,
        responses: updatedResponses,
        currentQuestion: result.text,
        isComplete: true,
      };
    }

    // Build prompt for next question
    const prompt = buildInterviewPrompt({
      language: user.language || "en",
      originCountry: user.originCountry || "your home country",
      destinationCountry: user.destinationCountry || "your destination",
      questionNumber: questionNumber + 1,
      previousResponses: updatedResponses,
    });

    // Generate next question
    const result = await culturalBridge.generate(prompt);

    return {
      questionNumber: questionNumber + 1,
      responses: updatedResponses,
      currentQuestion: result.text,
      isComplete: false,
    };
  },
});

/**
 * Reset interview and delete existing profile
 */
export const resetInterview = action({
  args: {},
  handler: async (ctx): Promise<InterviewState> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = (await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    })) as UserProfile | null;

    if (!user) throw new Error("User not found");

    // Delete existing profile if any
    const existing = (await ctx.runQuery(
      internal.cultural.profile.getProfileInternal,
      { userId: user._id }
    )) as CulturalProfile | null;

    if (existing) {
      await ctx.runMutation(internal.cultural.profile.deleteProfileInternal, {
        profileId: existing._id,
      });
    }

    // Start fresh interview
    const prompt = buildInterviewPrompt({
      language: user.language || "en",
      originCountry: user.originCountry || "your home country",
      destinationCountry: user.destinationCountry || "your destination",
      questionNumber: 1,
      previousResponses: {},
    });

    const result = await culturalBridge.generate(prompt);

    return {
      questionNumber: 1,
      responses: {},
      currentQuestion: result.text,
      isComplete: false,
    };
  },
});
