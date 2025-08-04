
'use client';

import { useState, useTransition } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';

import { expandWordDetails, type ExpandWordDetailsInput } from '@/ai/flows/expand-word-details';
import type { ExpandWordDetailsOutput } from '@/ai/genkit-output';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, FileText } from 'lucide-react';

const expansionFormSchema = z.object({
  word: z.string().min(1, { message: 'Please enter a word.' }),
  sentence: z.string().min(3, { message: 'Please enter a context sentence.' }),
});

export default function ExpansionPage() {
  const [expansion, setExpansion] = useState<ExpandWordDetailsOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof expansionFormSchema>>({
    resolver: zodResolver(expansionFormSchema),
    defaultValues: {
      word: '',
      sentence: '',
    },
  });

  const handleExpansion = async (data: ExpandWordDetailsInput) => {
    setExpansion(null);
    startTransition(async () => {
      try {
        const result = await expandWordDetails(data);
        if (result?.expansion) {
          setExpansion(result);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-accent" />
              Word Tools
            </CardTitle>
            <CardDescription>
              Enter a Latin word and its sentence to get a detailed grammatical breakdown.
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
                <FormField
                  control={form.control}
                  name="sentence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context Sentence</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Vera amicitia est rara." {...field} />
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
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            {isPending && (
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
                    Your detailed word analysis will appear here.
                  </p>
                </div>
            )}

            {expansion && (
              <ScrollArea className="h-[75vh] p-6">
                <ReactMarkdown
                  className="prose prose-sm dark:prose-invert max-w-none"
                  components={{
                    table: ({node, ...props}) => <table className="w-full text-left border-collapse" {...props} />,
                    thead: ({node, ...props}) => <thead className="bg-muted" {...props} />,
                    th: ({node, ...props}) => <th className="p-2 border" {...props} />,
                    td: ({node, ...props}) => <td className="p-2 border" {...props} />,
                  }}
                >
                  {expansion.expansion}
                </ReactMarkdown>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
