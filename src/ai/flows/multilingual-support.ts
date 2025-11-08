// src/ai/flows/multilingual-support.ts
'use server';

/**
 * @fileOverview A multilingual support AI agent.
 *
 * - translateText - A function that handles the text translation process.
 * - MultilingualSupportInput - The input type for the translateText function.
 * - MultilingualSupportOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultilingualSupportInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  language: z.enum(['en', 'kin', 'fr']).describe('The target language for translation (en: English, kin: Kinyarwanda, fr: French).'),
});
export type MultilingualSupportInput = z.infer<typeof MultilingualSupportInputSchema>;

const MultilingualSupportOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type MultilingualSupportOutput = z.infer<typeof MultilingualSupportOutputSchema>;

export async function translateText(input: MultilingualSupportInput): Promise<MultilingualSupportOutput> {
  return multilingualSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'multilingualSupportPrompt',
  input: {schema: MultilingualSupportInputSchema},
  output: {schema: MultilingualSupportOutputSchema},
  prompt: `Translate the following text to {{language}}:

{{text}}`,
});

const multilingualSupportFlow = ai.defineFlow(
  {
    name: 'multilingualSupportFlow',
    inputSchema: MultilingualSupportInputSchema,
    outputSchema: MultilingualSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
