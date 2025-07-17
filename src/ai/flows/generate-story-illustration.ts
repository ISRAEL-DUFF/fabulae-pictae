'use server';

/**
 * @fileOverview Flow to generate a color illustration for a given sentence.
 *
 * - generateStoryIllustration - A function that generates an illustration for a story sentence.
 * - GenerateStoryIllustrationInput - The input type for the generateStoryIllustration function.
 * - GenerateStoryIllustrationOutput - The return type for the generateStoryIllustration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryIllustrationInputSchema = z.object({
  sentence: z
    .string()
    .describe('The sentence from the Latin story to illustrate.'),
});
export type GenerateStoryIllustrationInput = z.infer<
  typeof GenerateStoryIllustrationInputSchema
>;

const GenerateStoryIllustrationOutputSchema = z.object({
  illustrationDataUri: z
    .string()
    .describe(
      'A data URI containing the generated image, including MIME type and Base64 encoding.'
    ),
});
export type GenerateStoryIllustrationOutput = z.infer<
  typeof GenerateStoryIllustrationOutputSchema
>;

export async function generateStoryIllustration(
  input: GenerateStoryIllustrationInput
): Promise<GenerateStoryIllustrationOutput> {
  return generateStoryIllustrationFlow(input);
}

const generateIllustrationPrompt = ai.definePrompt({
  name: 'generateIllustrationPrompt',
  input: {schema: GenerateStoryIllustrationInputSchema},
  output: {schema: GenerateStoryIllustrationOutputSchema},
  prompt: `Generate a color illustration for the following Latin sentence:

Sentence: {{{sentence}}}

Please return the image as a data URI.

Respond only with the data URI in the 'illustrationDataUri' field.`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateStoryIllustrationFlow = ai.defineFlow(
  {
    name: 'generateStoryIllustrationFlow',
    inputSchema: GenerateStoryIllustrationInputSchema,
    outputSchema: GenerateStoryIllustrationOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.sentence,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

    if (!media?.url) {
      throw new Error('No image was generated.');
    }

    return {illustrationDataUri: media.url};
  }
);
