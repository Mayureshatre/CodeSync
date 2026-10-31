import React from 'react';
import { Skeleton } from '../src/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-5 w-80 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-surface/50 space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
