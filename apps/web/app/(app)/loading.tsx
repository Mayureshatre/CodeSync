import React from 'react';
import { Skeleton, DiscoveryGridSkeleton } from '../../src/components/ui/Skeleton';

export default function AppLoading() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <Skeleton className="h-10 w-48 mb-3 rounded-xl" />
        <Skeleton className="h-6 w-96 rounded-lg" />
      </div>

      <div className="flex gap-4 border-b border-border pb-3">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full max-w-3xl rounded-xl" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="pt-4">
        <DiscoveryGridSkeleton count={6} />
      </div>
    </div>
  );
}
