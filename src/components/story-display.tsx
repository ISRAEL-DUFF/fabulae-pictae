'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { GenerateLatinStoryOutput } from '@/ai/flows/generate-latin-story';
import { getWordGloss, type GetWordGlossOutput } from '@/ai/flows/get-word-gloss';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, Download, Volume2, FileJson, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type StoryDisplayProps = {
  story: GenerateLatinStoryOutput;
};

type GlossCache = {
  [word: string]: GetWordGlossOutput;
};

export function StoryDisplay({ story }: StoryDisplayProps) {
  const [showGlosses, setShowGlosses] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeGloss, setActiveGloss] = useState<{ word: string; data: GetWordGlossOutput | null; loading: boolean }>({ word: '', data: null, loading: false });
  const [glossCache, setGlossCache] = useState<GlossCache>({});
  const { toast } = useToast();

  const storyId = story.story[0].sentence;

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteStories') || '{}');
    if (favorites[storyId]) {
      setIsFavorite(true);
    }
  }, [storyId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteStories') || '{}');
    const newIsFavorite = !isFavorite;
    
    if (newIsFavorite) {
      favorites[storyId] = story;
      toast({ title: "Story added to favorites!" });
    } else {
      delete favorites[storyId];
      toast({ title: "Story removed from favorites." });
    }
    
    localStorage.setItem('favoriteStories', JSON.stringify(favorites));
    setIsFavorite(newIsFavorite);
  };

  const handlePrint = () => {
    toast({
      title: "Printing Story",
      description: "Your story will be prepared for printing or saving as a PDF.",
    });
    // A simple way to allow saving as PDF
    window.print();
  };

  const handleJsonExport = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(story, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const safeTitle = story.story[0].sentence.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `fabula_${safeTitle}.json`;
      link.click();
      toast({
        title: "JSON Export Successful",
        description: "Your story has been downloaded.",
      });
    } catch (error) {
      console.error("Failed to export JSON", error);
      toast({
        variant: "destructive",
        title: "JSON Export Failed",
        description: "There was an error exporting your story.",
      });
    }
  };

  const handleWordClick = async (word: string, sentence: string) => {
    const cleanedWord = word.replace(/[.,;!?]/g, '');
    if (glossCache[cleanedWord]) {
      setActiveGloss({ word: cleanedWord, data: glossCache[cleanedWord], loading: false });
      return;
    }

    setActiveGloss({ word: cleanedWord, data: null, loading: true });
    try {
      const glossData = await getWordGloss({ word: cleanedWord, sentence });
      setGlossCache(prev => ({ ...prev, [cleanedWord]: glossData }));
      setActiveGloss({ word: cleanedWord, data: glossData, loading: false });
    } catch (error) {
      console.error('Failed to get gloss:', error);
      setActiveGloss({ word: cleanedWord, data: null, loading: false });
      toast({
        variant: 'destructive',
        title: 'Gloss Error',
        description: 'Could not fetch the gloss for this word.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="gloss-toggle"
              checked={showGlosses}
              onCheckedChange={setShowGlosses}
            />
            <Label htmlFor="gloss-toggle">Show Glosses</Label>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleFavorite}>
                    <Heart className={isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Favorite</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleJsonExport}>
                    <FileJson />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export as JSON</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handlePrint}>
                    <Download />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save as PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {story.story.map((item, index) => (
          <Card key={index} className="overflow-hidden shadow-lg">
            <Image
              src={item.imageUrl}
              alt={`Illustration for: ${item.sentence}`}
              width={600}
              height={400}
              className="w-full object-cover"
              data-ai-hint="illustration story"
            />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" disabled>
                   <Volume2 />
                   <span className="sr-only">Play audio</span>
                 </Button>
                <p className="text-lg md:text-xl leading-loose font-body">
                  {item.sentence.split(/(\s+|[.,;!?])/).filter(Boolean).map((word, i) =>
                    word.match(/[a-zA-Z]/) ? (
                      <Popover key={i}>
                        <PopoverTrigger asChild>
                          <span 
                            className={showGlosses ? 'cursor-pointer hover:bg-accent rounded-md px-1' : ''}
                            onClick={() => showGlosses && handleWordClick(word, item.sentence)}
                          >
                            {word}
                          </span>
                        </PopoverTrigger>
                        {showGlosses && (
                           <PopoverContent className="w-auto max-w-sm text-sm" side="top">
                             {activeGloss.loading && activeGloss.word === word.replace(/[.,;!?]/g, '') ? (
                               <div className="flex items-center gap-2">
                                 <Loader2 className="h-4 w-4 animate-spin" />
                                 <span>Fetching gloss...</span>
                               </div>
                             ) : activeGloss.data && activeGloss.word === word.replace(/[.,;!?]/g, '') ? (
                               <div className="space-y-2">
                                 <p><strong className="font-semibold">Gloss:</strong> {activeGloss.data.gloss}</p>
                                 <p><strong className="font-semibold">Morphology:</strong> {activeGloss.data.morphology}</p>
                                 <p><strong className="font-semibold">Syntax:</strong> {activeGloss.data.syntax}</p>
                               </div>
                             ) : (
                              <span>Click to see gloss.</span>
                             )}
                           </PopoverContent>
                        )}
                      </Popover>
                    ) : (
                      <span key={i}>{word}</span>
                    )
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
