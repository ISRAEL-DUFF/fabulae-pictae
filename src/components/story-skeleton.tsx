'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StorySkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="w-full h-[400px]" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
