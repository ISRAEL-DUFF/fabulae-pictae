
'use server';
/**
 * @fileOverview Provides a detailed grammatical gloss for a Latin word.
 *
 * - getWordGloss - A function that fetches the gloss for a word.
 * - GetWordGlossInput - The input type for the getWordGloss function.
 * - GetWordGlossOutput - The return type for the getWordGloss function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWordGlossInputSchema = z.object({
  word: z.string().describe('The Latin word to be glossed.'),
});
export type GetWordGlossInput = z.infer<typeof GetWordGlossInputSchema>;

const GetWordGlossOutputSchema = z.object({
  gloss: z.string().describe('The English definition or gloss of the word.'),
  morphology: z.string().describe('A detailed morphological analysis of the word (e.g., "Noun: Nom. Sg. Fem.").'),
  syntax: z.string().describe('A note on the syntactical function of the word (e.g., "Subject of a verb").'),
});
export type GetWordGlossOutput = z.infer<typeof GetWordGlossOutputSchema>;

export async function getWordGloss(input: GetWordGlossInput): Promise<GetWordGlossOutput> {
  return getWordGlossFlow(input);
}

const getWordGlossPrompt = ai.definePrompt({
  name: 'getWordGlossPrompt',
  input: {schema: GetWordGlossInputSchema},
  output: {schema: GetWordGlossOutputSchema},
  prompt: `You are a Latin grammar expert. Provide a detailed analysis for the word "{{word}}".

  Analyze the word and provide the following:
  1.  A concise English gloss.
  2.  A detailed morphological breakdown (part of speech, case, number, gender, tense, voice, mood, etc.).
  3.  A brief note on its syntactical role.
  `,
});

const getWordGlossFlow = ai.defineFlow(
  {
    name: 'getWordGlossFlow',
    inputSchema: GetWordGlossInputSchema,
    outputSchema: GetWordGlossOutputSchema,
  },
  async input => {
    const {output} = await getWordGlossPrompt(input);
    if (!output) {
        throw new Error('Failed to get gloss for the word.');
    }
    return output;
  }
);
