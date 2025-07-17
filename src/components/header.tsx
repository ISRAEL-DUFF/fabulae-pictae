'use client';

import { BookOpen } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <BookOpen className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground">
          Fabulae Pictae
        </h1>
      </div>
    </header>
  );
}
