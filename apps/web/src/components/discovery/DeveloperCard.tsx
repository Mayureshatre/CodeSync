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
    <div className="bg-[#181c24] p-6 rounded-[12px] border border-[#263042] flex flex-col h-full hover:border-[#06b6d4] transition-colors relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-white pr-12">{profile.displayName || profile.username || 'Developer'}</h2>
          {profile.title && <p className="text-[#06b6d4] text-sm mt-1">{profile.title}</p>}
        </div>
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => saveDeveloper(developer.id || profile.userId)}
            disabled={isPending}
            className="text-[#94a3b8] hover:text-[#06b6d4] transition-colors"
          >
            <BookmarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {developer.matchScore !== undefined && (
        <div className="mb-4 inline-flex items-center gap-2">
          <div className="flex items-center justify-center h-8 px-3 rounded-full border border-[#06b6d4] bg-[#06b6d4]/10 text-[#06b6d4] font-bold font-mono text-sm">
            Match: {Math.round(developer.matchScore)}%
          </div>
        </div>
      )}
      
      <p className="text-[#94a3b8] text-sm mb-4 line-clamp-3 flex-1">{profile.bio || 'No bio provided.'}</p>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {profile.experienceLevel && (
          <span className="px-2 py-1 bg-[#1e2433] text-[#f1f5f9] text-xs rounded border border-[#263042]">
            {profile.experienceLevel}
          </span>
        )}
        {profile.preferredCollaboration && (
          <span className="px-2 py-1 bg-[#1e2433] text-[#f1f5f9] text-xs rounded border border-[#263042]">
            {profile.preferredCollaboration}
          </span>
        )}
      </div>
      
      <Link href={`/developers/${developer.id || profile.userId}`} className="block w-full text-center py-2 bg-[#1e2433] hover:bg-[#263042] text-white rounded-[8px] transition-colors mt-auto font-bold border border-[#263042]">
        View Profile
      </Link>
    </div>
  );
}
