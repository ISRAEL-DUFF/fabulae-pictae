
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
  word: z.string().describe('The Latin word or comma-separated words to be expanded.'),
});
export type ExpandWordDetailsInput = z.infer<typeof ExpandWordDetailsInputSchema>;

const SingleExpansionSchema = z.object({
  word: z.string().describe('The original Latin word.'),
  expansion: z.string().describe('A detailed breakdown of the word in Markdown format, including gloss, etymology, and grammatical paradigms.'),
});

const ExpandWordDetailsOutputSchema = z.object({
  expansions: z.array(SingleExpansionSchema),
});
export type ExpandWordDetailsOutput = z.infer<typeof ExpandWordDetailsOutputSchema>;

export async function expandWordDetails(input: ExpandWordDetailsInput): Promise<ExpandWordDetailsOutput> {
  return expandWordDetailsFlow(input);
}

const expandWordDetailsPrompt = ai.definePrompt({
  name: 'expandWordDetailsPrompt',
  input: {schema: z.object({ word: z.string() })},
  output: {schema: z.object({ expansion: z.string() })},
  prompt: `You are an expert Latin linguist and etymologist. Provide a detailed analysis for the word "{{word}}".

The output must be in Markdown format.

First, determine the part of speech for "{{word}}".

If the word is a verb:
1.  **Gloss**: Provide its English definition.
2.  **Principal Parts**: Generate its principal parts.
3.  **Conjugation**: Generate its full conjugation paradigms in a Markdown table. This must include all tenses (Present, Imperfect, Future, Perfect, Pluperfect, Future Perfect), moods (Indicative, Subjunctive, Imperative), and voices (Active and Passive).
4.  **Etymology**: Give a detailed etymology of the word.

If the word is a participle:
1.  **Verb Source**: Identify the verb it is derived from.
2.  **Principal Parts**: Generate the source verb's principal parts.
3.  **Declension**: Generate the full declension paradigms for the participle in a Markdown table, including translations.
4.  **Etymology**: Give a detailed etymology of the source verb.
5.  **Usage**: Give a detailed description of the participle's usage.

If the word is a noun:
1.  **Gloss**: Provide its English definition.
2.  **Declension**: Generate its full declension paradigm in a Markdown table.
3.  **Etymology**: Give a detailed etymology of the word, including its root/stem.

If the word is an adjective:
1.  **Gloss**: Provide its English definition.
2.  **Declension**: Generate its full declension paradigm in a Markdown table.
3.  **Etymology**: Give a detailed etymology of the word, including its root/stem.
4.  **Usage**: Give a detailed description of the adjective's usage.

If the word is any other part of speech (pronoun, adverb, preposition, conjunction, etc.):
1.  **Description**: Describe the word and its function.
2.  **Etymology**: Give a detailed etymology of the word, including its root/stem.
3.  **Usage**: Give a detailed description of the word's usage.

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
    const words = input.word.split(',').map(w => w.trim()).filter(Boolean);
    
    const expansionPromises = words.map(async (word) => {
        const {output} = await expandWordDetailsPrompt({ word });
        if (!output) {
            throw new Error(`Failed to get expansion for word: ${word}`);
        }
        return {
            word: word,
            expansion: output.expansion,
        };
    });
    
    const expansions = await Promise.all(expansionPromises);

    if (expansions.length === 0) {
        throw new Error('No valid words were provided for expansion.');
    }

    return { expansions };
  }
);
