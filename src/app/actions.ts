
"use server";

import { translateText, type MultilingualSupportInput } from "@/ai/flows/multilingual-support";
import { analyzeVotingPatterns, type AnalyzeVotingPatternsInput } from "@/ai/flows/fraud-detection";
import { verifyNationalId, type NidaVerificationInput } from "@/ai/flows/nida-verification";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { firestoreDb } from "@/firebase";

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

export async function handleVerifyVote(receipt: string): Promise<{ success: boolean; error?: string }> {
  if (!firestoreDb) {
    return { success: false, error: "Database not available" };
  }
  if (!receipt || !receipt.startsWith('receipt-')) {
    return { success: false, error: "Invalid receipt format." };
  }

  // We can't query by the full receipt because it contains a timestamp.
  // Instead, we extract the part that would be the document ID in the votes collection.
  const parts = receipt.split('-');
  if (parts.length < 4) {
     return { success: false, error: "Invalid receipt format." };
  }
  
  const nationalId = parts[1];
  const groupId = parts[2];
  const voteId = `${nationalId}_${groupId}`;

  try {
    const votesCol = collection(firestoreDb, 'votes');
    const q = query(votesCol, where("__name__", "==", voteId), limit(1));
    const voteSnap = await getDocs(q);

    if (!voteSnap.empty) {
      return { success: true };
    } else {
      return { success: false, error: "Vote not found." };
    }
  } catch (e) {
    console.error("Error verifying vote:", e);
    return { success: false, error: "An error occurred during verification." };
  }
}
