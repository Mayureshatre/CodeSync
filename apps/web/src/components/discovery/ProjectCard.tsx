import React from 'react';
import Link from 'next/link';
import { BookmarkIcon, BookmarkCheckIcon } from 'lucide-react';
import { useSaveProject } from '../../hooks/useDiscovery';

interface ProjectCardProps {
  project: any;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { mutate: saveProject, isPending } = useSaveProject();
  
  return (
    <div className="bg-[#181c24] p-6 rounded-[12px] border border-[#263042] flex flex-col h-full hover:border-[#06b6d4] transition-colors relative">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white line-clamp-1 pr-12">{project.name}</h2>
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => saveProject(project.id)}
            disabled={isPending}
            className="text-[#94a3b8] hover:text-[#06b6d4] transition-colors"
          >
            <BookmarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {project.matchScore !== undefined && (
        <div className="mb-4 inline-flex items-center gap-2">
          <div className="flex items-center justify-center h-8 px-3 rounded-full border border-[#06b6d4] bg-[#06b6d4]/10 text-[#06b6d4] font-bold font-mono text-sm">
            Match: {Math.round(project.matchScore)}%
          </div>
        </div>
      )}
      
      <p className="text-[#94a3b8] text-sm mb-4 line-clamp-3 flex-1">{project.description}</p>
      
      {project.matchExplanation && (
        <div className="text-xs text-[#06b6d4] bg-[#06b6d4]/10 px-3 py-2 rounded mb-4">
          {project.matchExplanation}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-6">
        {project.category && (
          <span className="px-2 py-1 bg-[#1e2433] text-[#f1f5f9] text-xs rounded border border-[#263042]">
            {project.category}
          </span>
        )}
        {project.experienceRequirement && (
          <span className="px-2 py-1 bg-[#1e2433] text-[#f1f5f9] text-xs rounded border border-[#263042]">
            {project.experienceRequirement}
          </span>
        )}
      </div>
      
      <Link href={`/projects/${project.id}`} className="block w-full text-center py-2 bg-[#1e2433] hover:bg-[#263042] text-white rounded-[8px] transition-colors mt-auto font-bold border border-[#263042]">
        View Project
      </Link>
    </div>
  );
}
