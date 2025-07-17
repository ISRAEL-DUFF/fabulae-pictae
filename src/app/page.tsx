'use client';

import { useState, useTransition } from 'react';
import { generateLatinStory, type GenerateLatinStoryInput, type GenerateLatinStoryOutput } from '@/ai/flows/generate-latin-story';
import { AppHeader } from '@/components/header';
import { StoryGeneratorForm } from '@/components/story-generator-form';
import { StoryDisplay } from '@/components/story-display';
import { StorySkeleton } from '@/components/story-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [story, setStory] = useState<GenerateLatinStoryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateStory = async (data: GenerateLatinStoryInput) => {
    setError(null);
    setStory(null);

    startTransition(async () => {
      try {
        const result = await generateLatinStory(data);
        if (result && result.story) {
          setStory(result);
        } else {
          throw new Error('Failed to generate story. The output was empty.');
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Generating Story",
          description: errorMessage,
        })
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <StoryGeneratorForm onSubmit={handleGenerateStory} isGenerating={isGenerating} />
          </div>
          <div className="lg:col-span-2">
            <div className="h-full">
              {isGenerating && <StorySkeleton />}
              {!isGenerating && !story && !error && (
                <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed">
                  <CardHeader>
                    <div className="mx-auto bg-secondary p-4 rounded-full mb-4">
                      <BookOpenCheck className="w-12 h-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Welcome to Fabulae Pictae</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Fill out the form to your left to generate a new illustrated Latin story.
                    </p>
                  </CardContent>
                </Card>
              )}
              {story && <StoryDisplay story={story} key={story.story[0].sentence} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
