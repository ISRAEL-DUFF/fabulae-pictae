
'use server';
/**
 * @fileOverview Provides a detailed expansion for a Latin word, including etymology, paradigms, and usage.
 *
 * - expandWordDetails - A function that fetches the detailed expansion for a word.
 * - ExpandWordDetailsInput - The input type for the expandWordDetails function.
 * - ExpandWordDetailsOutput - The return type for the expandWordDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandWordDetailsInputSchema = z.object({
  word: z.string().describe('The Latin word to be expanded.'),
  sentence: z.string().describe('The full Latin sentence containing the word, for context.'),
});
export type ExpandWordDetailsInput = z.infer<typeof ExpandWordDetailsInputSchema>;

const ExpandWordDetailsOutputSchema = z.object({
  expansion: z.string().describe('A detailed breakdown of the word in Markdown format, including gloss, etymology, and grammatical paradigms.'),
});
export type ExpandWordDetailsOutput = z.infer<typeof ExpandWordDetailsOutputSchema>;

export async function expandWordDetails(input: ExpandWordDetailsInput): Promise<ExpandWordDetailsOutput> {
  return expandWordDetailsFlow(input);
}

const expandWordDetailsPrompt = ai.definePrompt({
  name: 'expandWordDetailsPrompt',
  input: {schema: ExpandWordDetailsInputSchema},
  output: {schema: ExpandWordDetailsOutputSchema},
  prompt: `You are an expert Latin linguist and etymologist. Provide a detailed analysis for the word "{{word}}" in the context of the sentence "{{sentence}}".

The output must be in Markdown format.

First, determine the part of speech for "{{word}}".

If the word is a verb:
1.  **Gloss**: Provide its English definition.
2.  **Principal Parts**: Generate its principal parts.
3.  **Conjugation**: Generate its full conjugation paradigms in a Markdown table.
4.  **Etymology**: Give a detailed etymology of the word.

If the word is a participle:
1.  **Verb Source**: Identify the verb it is derived from.
2.  **Principal Parts**: Generate the verb's principal parts.
3.  **Declension**: Generate the full declension paradigms for the participle in a Markdown table, including translations.
4.  **Etymology**: Give a detailed etymology of the source verb.
5.  **Usage**: Give a detailed description of the participle's usage in the sentence.

If the word is a noun:
1.  **Gloss**: Provide its English definition.
2.  **Declension**: Generate its full declension paradigm in a Markdown table.
3.  **Etymology**: Give a detailed etymology of the word, including its root/stem.

If the word is an adjective:
1.  **Gloss**: Provide its English definition.
2.  **Declension**: Generate its full declension paradigm in a Markdown table.
3.  **Etymology**: Give a detailed etymology of the word, including its root/stem.
4.  **Usage**: Give a detailed description of the adjective's usage in the sentence.

If the word is any other part of speech (pronoun, adverb, preposition, conjunction, etc.):
1.  **Description**: Describe the word and its function.
2.  **Etymology**: Give a detailed etymology of the word, including its root/stem.
3.  **Usage**: Give a detailed description of the word's usage in the sentence.

Use Markdown tables for all paradigms (conjugations and declensions).
`,
});

const expandWordDetailsFlow = ai.defineFlow(
  {
    name: 'expandWordDetailsFlow',
    inputSchema: ExpandWordDetailsInputSchema,
    outputSchema: ExpandWordDetailsOutputSchema,
  },
  async input => {
    const {output} = await expandWordDetailsPrompt(input);
    if (!output) {
        throw new Error('Failed to get word expansion.');
    }
    return output;
  }
);
