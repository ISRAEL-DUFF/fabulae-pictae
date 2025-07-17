
// src/ai/flows/generate-latin-story.ts
'use server';

/**
 * @fileOverview Generates short, illustrated Latin stories based on user-selected level, grammar scope, and topic.
 *
 * - generateLatinStory - A function that generates the latin story.
 * - GenerateLatinStoryInput - The input type for the generateLatinStory function.
 * - GenerateLatinStoryOutput - The return type for the generateLatinStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLatinStoryInputSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The learner level.'),
  topic: z.string().describe('The topic of the story (e.g., animals, home life, myth, NT parable).'),
  grammarScope: z.string().optional().describe('The grammatical scope to use in the story (e.g., Present, Aorist, Participles).'),
  storyLength: z.number().min(6).max(12).default(8).describe('The number of sentences in the story.'),
});

export type GenerateLatinStoryInput = z.infer<typeof GenerateLatinStoryInputSchema>;

const StorySentenceSchema = z.object({
  sentence: z.string().describe('A sentence from the story in Latin.'),
  prompt: z.string().describe('A prompt for an image to illustrate the sentence. The image should be kid friendly and in a cartoon style.'),
});

const GenerateLatinStoryOutputSchema = z.object({
  story: z.array(z.object({
    sentence: z.string().describe('A sentence from the story in Latin.'),
    imageUrl: z.string().describe('The URL of the generated image for the sentence.'),
  })).describe('The generated Latin story with corresponding image URLs.'),
});

export type GenerateLatinStoryOutput = z.infer<typeof GenerateLatinStoryOutputSchema>;

export async function generateLatinStory(input: GenerateLatinStoryInput): Promise<GenerateLatinStoryOutput> {
  return generateLatinStoryFlow(input);
}

const generateLatinStoryPrompt = ai.definePrompt({
  name: 'generateLatinStoryPrompt',
  input: {schema: GenerateLatinStoryInputSchema},
  output: {schema: z.object({story: z.array(StorySentenceSchema)})},
  prompt: `You are a Latin story writer for language learners.

  Create a short story of {{storyLength}} sentences in Latin for {{level}} learners about the topic of {{topic}}.
  The story should use high-frequency vocabulary and simple grammatical structures.
  The grammatical scope for the story is: {{grammarScope}}.

  For each sentence in the story, also generate a prompt that can be used to generate an illustration for the sentence. The image should be kid friendly and in a cartoon style.
  `,
});

const generateLatinStoryFlow = ai.defineFlow(
  {
    name: 'generateLatinStoryFlow',
    inputSchema: GenerateLatinStoryInputSchema,
    outputSchema: GenerateLatinStoryOutputSchema,
  },
  async input => {
    const {output} = await generateLatinStoryPrompt(input);
    
    if (!output?.story) {
        throw new Error('Failed to generate story. The output was empty.');
    }
    const storyWithPrompts = output.story;

    const storyWithImageUrls = await Promise.all(
      storyWithPrompts.map(async (item: any) => {
        const {media} = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: item.prompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
        if (!media) {
          throw new Error('no media returned');
        }
        return {
          sentence: item.sentence,
          imageUrl: media.url,
        };
      })
    );

    return {story: storyWithImageUrls};
  }
);
