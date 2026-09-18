import React from 'react';
import Link from 'next/link';
import { BookmarkIcon } from 'lucide-react';
import { useSaveProject } from '../../hooks/useDiscovery';

interface ProjectCardProps {
  project: any;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { mutate: saveProject, isPending } = useSaveProject();
  
  return (
    <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat flex flex-col h-full hover:shadow-elevation-overlay hover:-translate-y-1 transition-all duration-300 relative group">
      <div className="flex justify-between items-start mb-5">
        <h2 className="text-xl font-bold tracking-tight text-primary line-clamp-2 pr-12">{project.name}</h2>
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
            <button 
              onClick={() => saveProject(project.id)}
              disabled={isPending}
              className="text-muted hover:text-accent hover:bg-accent/10 min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 rounded-full transition-all duration-200"
              title="Save Project"
              aria-label="Save Project"
            >
            <BookmarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {project.matchScore !== undefined && (
        <div className="mb-5">
          <div className="inline-flex items-center h-7 px-3 rounded-full border border-accent bg-accent/10 text-accent font-semibold font-mono text-xs tracking-wide">
            MATCH {Math.round(project.matchScore)}%
          </div>
        </div>
      )}
      
      <p className="text-secondary text-sm leading-relaxed mb-6 line-clamp-3 flex-1">{project.description}</p>
      
      {project.matchExplanation && (
        <div className="text-xs text-accent bg-accent/5 px-4 py-3 rounded-xl border border-accent/20 mb-6 font-medium leading-relaxed">
          ✨ {project.matchExplanation}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-6">
        {project.category && (
          <span className="px-2.5 py-1 bg-surface-elevated text-primary font-medium text-xs rounded border border-border shadow-elevation-low">
            {project.category}
          </span>
        )}
        {project.experienceRequirement && (
          <span className="px-2.5 py-1 bg-surface-elevated text-primary font-medium text-xs rounded border border-border shadow-elevation-low capitalize">
            {project.experienceRequirement.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      
      <Link href={`/projects/${project.id}`} className="block w-full text-center py-2.5 bg-background hover:border-accent hover:text-accent text-primary rounded-xl transition-all duration-200 mt-auto font-medium border border-border shadow-elevation-low group-hover:bg-surface-elevated">
        View Project
      </Link>
    </div>
  );
}
