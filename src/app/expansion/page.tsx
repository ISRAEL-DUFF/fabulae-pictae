
'use client';

import { useState, useTransition, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { expandWordDetails, type ExpandWordDetailsInput } from '@/ai/flows/expand-word-details';
import { saveWordExpansion, getSavedWordExpansions, type SavedExpansion } from '@/services/wordService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, FileText, History, Trash2 } from 'lucide-react';

const expansionFormSchema = z.object({
  word: z.string().min(1, { message: 'Please enter a word.' }),
});

export default function ExpansionPage() {
  const [expansion, setExpansion] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedExpansions, setSavedExpansions] = useState<SavedExpansion[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof expansionFormSchema>>({
    resolver: zodResolver(expansionFormSchema),
    defaultValues: {
      word: '',
    },
  });

  const fetchSavedExpansions = async () => {
    const { data, error } = await getSavedWordExpansions();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error Fetching History',
        description: 'Could not load your previously saved word expansions.',
      });
    } else if (data) {
      setSavedExpansions(data);
    }
  };

  useEffect(() => {
    fetchSavedExpansions();
  }, []);

  const handleExpansion = async (data: ExpandWordDetailsInput) => {
    setExpansion(null);
    startTransition(async () => {
      try {
        // Check if word is already in history to avoid re-generating
        const existingExpansion = savedExpansions.find(e => e.word.toLowerCase() === data.word.toLowerCase());
        if (existingExpansion) {
            setExpansion(existingExpansion.expansion);
            toast({
                title: "Loaded from History",
                description: `Displaying saved expansion for "${data.word}".`,
            });
            return;
        }

        const result = await expandWordDetails(data);
        if (result?.expansion) {
          setExpansion(result.expansion);
          const { error: saveError } = await saveWordExpansion(data.word, result.expansion);
          if (saveError) {
             throw new Error('The expansion could not be saved.');
          }
          await fetchSavedExpansions(); // Refresh list
        } else {
          throw new Error('The expansion result was empty.');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error Generating Expansion',
          description: errorMessage,
        });
      }
    });
  };
  
  const handleHistoryClick = (savedExpansion: SavedExpansion) => {
    form.setValue('word', savedExpansion.word);
    setExpansion(savedExpansion.expansion);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-accent" />
              Word Tools
            </CardTitle>
            <CardDescription>
              Enter a Latin word to get a detailed grammatical breakdown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleExpansion)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="word"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Word</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., amicitia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Word'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <History className="w-6 h-6 text-accent" />
                    History
                </CardTitle>
                <CardDescription>
                    Previously analyzed words.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {savedExpansions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No words analyzed yet.</p>
                ) : (
                    <ScrollArea className="h-60">
                        <div className="space-y-2">
                        {savedExpansions.map((item) => (
                            <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start font-normal"
                            onClick={() => handleHistoryClick(item)}
                            >
                            {item.word}
                            </Button>
                        ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            {(isPending) && (
              <div className="flex items-center justify-center h-full p-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-lg">Generating detailed expansion...</span>
                </div>
              </div>
            )}

            {!isPending && !expansion && (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                  <div className="mx-auto bg-secondary p-4 rounded-full mb-4">
                    <FileText className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-2xl">Word Expansion</CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Your detailed word analysis will appear here. Select one from your history or analyze a new one.
                  </p>
                </div>
            )}

            {expansion && (
              <ScrollArea className="h-[75vh] p-6">
                <ReactMarkdown
                  className="prose dark:prose-invert max-w-none"
                  remarkPlugins={[remarkGfm]}
                >
                  {expansion}
                </ReactMarkdown>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
