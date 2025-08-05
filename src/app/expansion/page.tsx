
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { expandWordDetails, type ExpandWordDetailsInput } from '@/ai/flows/expand-word-details';
import { saveWordExpansion, getSavedWordExpansions, updateWordExpansion, searchWordExpansions, type SavedExpansion } from '@/services/wordService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, FileText, History, Edit, Save, X, Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const expansionFormSchema = z.object({
  word: z.string().min(1, { message: 'Please enter a word.' }),
});

function SearchExpansionsModal({ onSelect }: { onSelect: (expansion: SavedExpansion) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SavedExpansion[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    const { toast } = useToast();
  
    const handleSearch = useCallback(() => {
        startSearchTransition(async () => {
            const { data, error } = await searchWordExpansions(searchTerm);
            if (error) {
            toast({
                variant: 'destructive',
                title: 'Search Error',
                description: 'Could not perform search.',
            });
            } else {
            setResults(data || []);
            }
        });
    }, [searchTerm, toast]);
  
    useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
        if (searchTerm) {
            handleSearch();
        } else {
            setResults([]);
        }
      }, 300);
  
      return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, handleSearch]);
  
    return (
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Expansions</DialogTitle>
          <DialogDescription>
            Search for words within your saved expansions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <Input
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
                 <div className="flex items-center justify-center p-4">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                 </div>
            )}
            {!isSearching && results.length > 0 && (
                <ScrollArea className="h-60">
                    <div className="space-y-2">
                    {results.map((item) => (
                        <Button
                        key={item.id}
                        variant="ghost"
                        className="w-full justify-start font-normal"
                        onClick={() => onSelect(item)}
                        >
                        {item.word}
                        </Button>
                    ))}
                    </div>
                </ScrollArea>
            )}
            {!isSearching && results.length === 0 && searchTerm && (
                <p className="text-sm text-center text-muted-foreground p-4">No results found.</p>
            )}
        </div>
      </DialogContent>
    );
  }

export default function ExpansionPage() {
  const [activeExpansion, setActiveExpansion] = useState<SavedExpansion | null>(null);
  const [editableContent, setEditableContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [savedExpansions, setSavedExpansions] = useState<SavedExpansion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
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
    setActiveExpansion(null);
    setIsEditing(false);
    setProgress(0);
    setBatchStatus('');

    const words = data.word.split(',').map(w => w.trim()).filter(Boolean);

    startTransition(async () => {
      try {
        if (words.length === 1) {
            const word = words[0];
            const existingExpansion = savedExpansions.find(e => e.word.toLowerCase() === word.toLowerCase());
            if (existingExpansion) {
                setActiveExpansion(existingExpansion);
                toast({
                    title: "Loaded from History",
                    description: `Displaying saved expansion for "${word}".`,
                });
                return;
            }
        }

        const result = await expandWordDetails(data);
        if (result?.expansions?.length) {
            const total = result.expansions.length;
            let savedCount = 0;
            const newExpansions: SavedExpansion[] = [];

            for (const expansion of result.expansions) {
                setBatchStatus(`Saving "${expansion.word}"...`);
                const { data: savedData, error: saveError } = await saveWordExpansion(expansion.word, expansion.expansion);
                if (saveError || !savedData) {
                    throw new Error(`The expansion for "${expansion.word}" could not be saved.`);
                }
                newExpansions.push(savedData[0]);
                savedCount++;
                setProgress((savedCount / total) * 100);
            }
          
            await fetchSavedExpansions();
            setActiveExpansion(newExpansions[newExpansions.length - 1]); // Show the last one
            toast({
                title: 'Batch Expansion Complete',
                description: `${savedCount} word(s) were successfully analyzed and saved.`,
            });

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
      } finally {
        setProgress(0);
        setBatchStatus('');
      }
    });
  };
  
  const handleHistoryClick = (savedExpansion: SavedExpansion) => {
    form.setValue('word', savedExpansion.word);
    setActiveExpansion(savedExpansion);
    setIsEditing(false);
  }

  const handleSearchSelect = (savedExpansion: SavedExpansion) => {
    handleHistoryClick(savedExpansion);
    setIsSearchOpen(false);
  }

  const handleEditClick = () => {
    if (activeExpansion) {
      setEditableContent(activeExpansion.expansion);
      setIsEditing(true);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditableContent('');
  };

  const handleUpdate = async () => {
      if (!activeExpansion) return;

      startUpdateTransition(async () => {
          try {
            const { error } = await updateWordExpansion(activeExpansion.id, editableContent);
            if (error) {
                throw new Error('Failed to update the expansion.');
            }
            // Update the state locally and globally
            const updatedExpansion = { ...activeExpansion, expansion: editableContent };
            setActiveExpansion(updatedExpansion);
            setSavedExpansions(prev => prev.map(e => e.id === activeExpansion.id ? updatedExpansion : e));

            setIsEditing(false);
            toast({
                title: 'Update Successful',
                description: `Expansion for "${activeExpansion.word}" has been saved.`,
            });
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            toast({
                variant: 'destructive',
                title: 'Error Updating Expansion',
                description: errorMessage,
            });
          }
      });
  };

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
              Enter a Latin word (or comma-separated words) for a detailed grammatical breakdown.
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
                      <FormLabel>Word(s)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., amicitia, rex, currere" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                        </>
                    ) : (
                        'Analyze Word(s)'
                    )}
                    </Button>
                    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </DialogTrigger>
                        <SearchExpansionsModal onSelect={handleSearchSelect} />
                    </Dialog>
                </div>
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
            {isPending && (
              <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-lg">Generating detailed expansion...</span>
                </div>
                {batchStatus && (
                  <div className="w-full max-w-sm text-center">
                    <Progress value={progress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">{batchStatus}</p>
                  </div>
                )}
              </div>
            )}

            {!isPending && !activeExpansion && (
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

            {activeExpansion && (
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{activeExpansion.word}</h3>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelClick} disabled={isUpdating}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button size="sm" variant="outline" onClick={handleEditClick}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
                <div className="flex-grow overflow-auto" data-color-mode="light">
                    {isEditing ? (
                        <MDEditor
                            value={editableContent}
                            onChange={(value) => setEditableContent(value || '')}
                            preview="live"
                            height="100%"
                            style={{minHeight: '65vh'}}
                        />
                    ) : (
                        <ScrollArea className="h-[70vh] p-6">
                            <ReactMarkdown
                                className="prose dark:prose-invert max-w-none"
                                remarkPlugins={[remarkGfm]}
                            >
                                {activeExpansion.expansion}
                            </ReactMarkdown>
                        </ScrollArea>
                    )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
