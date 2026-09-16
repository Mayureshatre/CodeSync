import React from 'react';
import Link from 'next/link';
import { BookmarkIcon } from 'lucide-react';
import { useSaveDeveloper } from '../../hooks/useDiscovery';

interface DeveloperCardProps {
  developer: any;
}

export function DeveloperCard({ developer }: DeveloperCardProps) {
  const { mutate: saveDeveloper, isPending } = useSaveDeveloper();
  const profile = developer.profile || developer; // handle different nested shapes
  
  return (
    <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat flex flex-col h-full hover:shadow-elevation-overlay hover:-translate-y-1 transition-all duration-300 relative group">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary pr-12 line-clamp-1">{profile.displayName || profile.username || 'Developer'}</h2>
          {profile.title ? (
            <p className="text-accent font-medium text-sm mt-1">{profile.title}</p>
          ) : (
            <p className="text-secondary font-medium text-sm mt-1">@{profile.username}</p>
          )}
        </div>
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
          <button 
            onClick={() => saveDeveloper(developer.id || profile.userId)}
            disabled={isPending}
            className="text-muted hover:text-accent hover:bg-accent/10 p-2 -m-2 rounded-full transition-all duration-200"
            title="Save Developer"
          >
            <BookmarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {developer.matchScore !== undefined && (
        <div className="mb-5">
          <div className="inline-flex items-center h-7 px-3 rounded-full border border-accent bg-accent/10 text-accent font-semibold font-mono text-xs tracking-wide">
            MATCH {Math.round(developer.matchScore)}%
          </div>
        </div>
      )}
      
      <p className="text-secondary text-sm leading-relaxed mb-6 line-clamp-3 flex-1">{profile.bio || 'No bio provided.'}</p>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {profile.experienceLevel && (
          <span className="px-2.5 py-1 bg-surface-elevated text-primary font-medium text-xs rounded border border-border shadow-elevation-low">
            {profile.experienceLevel.replace(/_/g, ' ')}
          </span>
        )}
        {profile.availability && (
          <span className="px-2.5 py-1 bg-surface-elevated text-primary font-medium text-xs rounded border border-border shadow-elevation-low capitalize">
            {profile.availability.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      
      <Link href={`/developers/${developer.id || profile.userId}`} className="block w-full text-center py-2.5 bg-background hover:border-accent hover:text-accent text-primary rounded-xl transition-all duration-200 mt-auto font-medium border border-border shadow-elevation-low group-hover:bg-surface-elevated">
        View Profile
      </Link>
    </div>
  );
}
