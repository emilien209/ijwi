"use server";

import { translateText, type MultilingualSupportInput } from "@/ai/flows/multilingual-support";
import { analyzeVotingPatterns, type AnalyzeVotingPatternsInput } from "@/ai/flows/fraud-detection";
import { verifyNationalId, type NidaVerificationInput } from "@/ai/flows/nida-verification";

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

export async function handleNidaVerification(input: NidaVerificationInput) {
  try {
    const result = await verifyNationalId(input);
    if (result.isValid) {
      return { success: true, data: result };
    }
    return { success: false, error: "Invalid or unregistered National ID." };
  } catch (error) {
    console.error("NIDA verification error:", error);
    return { success: false, error: "Could not connect to verification service." };
  }
}
