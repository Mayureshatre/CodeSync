import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-border/50 dark:bg-border/30 transition-colors ${className}`}
      {...props}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat flex flex-col h-full min-h-[320px]">
      <div className="flex justify-between items-start mb-5">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2.5 rounded-md" />
      <Skeleton className="h-4 w-5/6 mb-6 rounded-md" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full mt-auto rounded-xl" />
    </div>
  );
}

export function DeveloperCardSkeleton() {
  return (
    <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat flex flex-col h-full min-h-[320px]">
      <div className="flex justify-between items-start mb-5">
        <div className="w-full">
          <Skeleton className="h-6 w-1/2 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-1/3 rounded-md" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full ml-4" />
      </div>
      <Skeleton className="h-4 w-full mb-2.5 rounded-md" />
      <Skeleton className="h-4 w-4/5 mb-6 rounded-md" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full mt-auto rounded-xl" />
    </div>
  );
}

export function DiscoveryGridSkeleton({ type = 'projects', count = 6 }: { type?: 'projects' | 'developers'; count?: number }) {
  const CardComponent = type === 'projects' ? ProjectCardSkeleton : DeveloperCardSkeleton;
  return (
    <div
      role="status"
      aria-label={`Loading ${type}...`}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
      <span className="sr-only">Loading {type}...</span>
    </div>
  );
}
