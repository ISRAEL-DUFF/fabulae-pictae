'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { GenerateLatinStoryInput } from '@/ai/flows/generate-latin-story';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  topic: z.string().min(2, {
    message: 'Topic must be at least 2 characters.',
  }),
  grammarScope: z.string().optional(),
  storyLength: z.number().min(6).max(12),
});

type StoryGeneratorFormProps = {
  onSubmit: (data: GenerateLatinStoryInput) => void;
  isGenerating: boolean;
};

export function StoryGeneratorForm({ onSubmit, isGenerating }: StoryGeneratorFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: 'Beginner',
      topic: 'animals',
      grammarScope: 'Present tense',
      storyLength: 8,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Create a Story
        </CardTitle>
        <CardDescription>
          Provide details to generate a custom illustrated story in Latin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., animals, home life, myth" {...field} />
                  </FormControl>
                  <FormDescription>What should the story be about?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learner Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grammarScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grammar Scope (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Present, Aorist, Participles" {...field} />
                  </FormControl>
                  <FormDescription>Specific grammar to focus on.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storyLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Length ({field.value} sentences)</FormLabel>
                  <FormControl>
                    <Slider
                      min={6}
                      max={12}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Story'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
