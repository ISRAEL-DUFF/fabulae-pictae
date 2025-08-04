'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/', label: 'Story Generator', icon: BookOpen },
  { href: '/expansion', label: 'Word Tools', icon: Wrench },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <div className="mr-8 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground">
            Fabulae Pictae
            </h1>
        </div>

        <nav className="flex items-center space-x-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Button key={link.href} variant={isActive ? "secondary" : "ghost"} asChild>
                <Link href={link.href} className="flex items-center gap-2">
                  <link.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
