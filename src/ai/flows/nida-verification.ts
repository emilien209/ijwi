'use server';

/**
 * @fileOverview NIDA (National Identification Agency) verification flow.
 *
 * - verifyNationalId - A function that simulates verifying a national ID against the NIDA database.
 * - NidaVerificationInput - The input type for the verifyNationalId function.
 * - NidaVerificationOutput - The return type for the verifyNationalId function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NidaVerificationInputSchema = z.object({
  nationalId: z.string().length(16, "National ID must be 16 digits.").describe("The 16-digit national ID number to verify."),
  dob: z.string().describe("The user's date of birth as a YYYY-MM-DD string."),
});
export type NidaVerificationInput = z.infer<typeof NidaVerificationInputSchema>;

const NidaVerificationOutputSchema = z.object({
  isValid: z.boolean().describe("Whether the national ID is valid and exists in the NIDA database."),
  fullName: z.string().optional().describe("The full name of the citizen if the ID is valid."),
  reason: z.string().optional().describe("The reason for failure, if any.")
});
export type NidaVerificationOutput = z.infer<typeof NidaVerificationOutputSchema>;


const checkNidaDatabaseTool = ai.defineTool(
    {
        name: 'checkNidaDatabase',
        description: 'Checks if a Rwandan National ID and Date of Birth (as YYYY-MM-DD string) match in a mock NIDA database. For this simulation, all 16-digit numbers are considered valid and the year of birth must match the one in the ID.',
        inputSchema: z.object({ nationalId: z.string(), dob: z.string() }),
        outputSchema: z.object({
            isRegistered: z.boolean(),
            fullName: z.string().optional(),
            reason: z.enum(["ID_DOB_MISMATCH", "NOT_FOUND", "VALID"]).optional(),
        })
    },
    async (input) => {
        // In a real application, this would involve a secure API call to the actual NIDA service.
        // For this demo, we simulate this.
        const isValidFormat = input.nationalId.length === 16 && /^\d+$/.test(input.nationalId);
        if (!isValidFormat) {
            return { isRegistered: false, reason: "NOT_FOUND" };
        }

        const birthYearFromId = parseInt(input.nationalId.substring(1, 5));
        const birthYearFromDob = new Date(input.dob).getFullYear();

        if (birthYearFromId !== birthYearFromDob) {
            return { isRegistered: false, reason: "ID_DOB_MISMATCH" };
        }

        // Simulate a name based on the ID for demo purposes
        const names = ["Mugisha Jean Claude", "Uwamahoro Marie", "Ntaganda Paul", "Mukeshimana Alice", "Hakizimana Emmanuel"];
        const randomIndex = parseInt(input.nationalId.slice(-1)) % names.length;

        return {
            isRegistered: true,
            fullName: names[randomIndex],
            reason: "VALID"
        };
    }
);


export async function verifyNationalId(input: NidaVerificationInput): Promise<NidaVerificationOutput> {
  return nidaVerificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nidaVerificationPrompt',
  input: { schema: NidaVerificationInputSchema },
  output: { schema: NidaVerificationOutputSchema },
  system: "You are a citizen identity verification agent for the National Identification Agency (NIDA) of Rwanda. Your task is to use the provided tool to check if a national ID and date of birth are registered. If verification fails, you must provide the reason. Then format the output.",
  tools: [checkNidaDatabaseTool]
});

const nidaVerificationFlow = ai.defineFlow(
  {
    name: 'nidaVerificationFlow',
    inputSchema: NidaVerificationInputSchema,
    outputSchema: NidaVerificationOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const toolResponse = llmResponse.toolRequest?.tool?.response.output;

    if (toolResponse) {
        return {
            isValid: toolResponse.isRegistered,
            fullName: toolResponse.fullName,
            reason: toolResponse.reason,
        }
    }
    
    // Fallback in case the tool isn't called
    return llmResponse.output || { isValid: false, reason: "SERVICE_ERROR" };
  }
);
