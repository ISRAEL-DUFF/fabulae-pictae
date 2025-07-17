'use client';

import { useState, useTransition, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error('File content is not readable.');
        }
        const parsedStory = JSON.parse(content);
        
        // Basic validation
        if (parsedStory && Array.isArray(parsedStory.story) && parsedStory.story.length > 0) {
          setStory(parsedStory);
          setError(null);
          toast({
            title: "Story Imported",
            description: "Your story has been successfully loaded.",
          });
        } else {
          throw new Error('Invalid story file format.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: `Could not import story. ${errorMessage}`,
        });
      } finally {
        // Reset file input so user can select the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: 'There was an error reading the selected file.',
      });
    };
    reader.readAsText(file);
  };


  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <StoryGeneratorForm 
              onSubmit={handleGenerateStory} 
              isGenerating={isGenerating} 
              onImportClick={handleImportClick} 
            />
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="application/json"
            />
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
                      Fill out the form to your left to generate a new illustrated Latin story, or import one from a file.
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
