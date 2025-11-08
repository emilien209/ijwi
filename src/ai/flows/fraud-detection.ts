'use server';

/**
 * @fileOverview Fraud detection flow using generative AI to analyze voting patterns for anomalies.
 *
 * - analyzeVotingPatterns - Analyzes voting data for potential fraud.
 * - AnalyzeVotingPatternsInput - The input type for analyzeVotingPatterns.
 * - AnalyzeVotingPatternsOutput - The return type for analyzeVotingPatterns.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVotingPatternsInputSchema = z.object({
  votingData: z
    .string()
    .describe('A JSON string containing voting data, including voter IDs and candidate choices.'),
});
export type AnalyzeVotingPatternsInput = z.infer<typeof AnalyzeVotingPatternsInputSchema>;

const AnalyzeVotingPatternsOutputSchema = z.object({
  anomalies: z.array(z.string()).describe('An array of strings describing any detected anomalies.'),
  summary: z.string().describe('A summary of the fraud analysis.'),
});
export type AnalyzeVotingPatternsOutput = z.infer<typeof AnalyzeVotingPatternsOutputSchema>;

export async function analyzeVotingPatterns(
  input: AnalyzeVotingPatternsInput
): Promise<AnalyzeVotingPatternsOutput> {
  return analyzeVotingPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVotingPatternsPrompt',
  input: {schema: AnalyzeVotingPatternsInputSchema},
  output: {schema: AnalyzeVotingPatternsOutputSchema},
  prompt: `You are an expert in election fraud detection. Analyze the following voting data for any anomalies or suspicious patterns. Provide a summary of your findings and a list of any specific anomalies detected.

Voting Data:
{{{votingData}}}

Output should be a JSON object with 'anomalies' and 'summary' fields.`,
});

const analyzeVotingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeVotingPatternsFlow',
    inputSchema: AnalyzeVotingPatternsInputSchema,
    outputSchema: AnalyzeVotingPatternsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
