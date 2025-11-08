"use server";

import { translateText, type MultilingualSupportInput } from "@/ai/flows/multilingual-support";
import { analyzeVotingPatterns, type AnalyzeVotingPatternsInput } from "@/ai/flows/fraud-detection";

export async function handleTranslation(input: MultilingualSupportInput) {
  try {
    const result = await translateText(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Translation error:", error);
    return { success: false, error: "Failed to translate text." };
  }
}

export async function handleFraudAnalysis(input: AnalyzeVotingPatternsInput) {
  try {
    const result = await analyzeVotingPatterns(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Fraud analysis error:", error);
    return { success: false, error: "Failed to analyze data." };
  }
}
