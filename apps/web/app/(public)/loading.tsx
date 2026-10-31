import React from 'react';
import { Skeleton, DiscoveryGridSkeleton } from '../../src/components/ui/Skeleton';

export default function PublicLoading() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <Skeleton className="h-10 w-64 mb-3 rounded-xl" />
        <Skeleton className="h-6 w-96 rounded-lg" />
      </div>

      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-full max-w-3xl rounded-xl" />
        <DiscoveryGridSkeleton count={6} />
      </div>
    </div>
  );
}
