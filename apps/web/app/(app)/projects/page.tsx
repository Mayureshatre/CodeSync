import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCurrentSession } from '@/src/lib/auth';
import { getProjectsByOwner } from '@/src/server/services/projectService';
import { ProjectCard } from '@/src/components/discovery/ProjectCard';

export const metadata = {
  title: 'My Projects | CodeSync',
  description: 'Manage your projects and applications',
};

export default async function MyProjectsPage() {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const projects = await getProjectsByOwner(session.user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Projects</h1>
          <p className="text-secondary mt-1">Manage your created projects and applications</p>
        </div>
        <Link 
          href="/projects/new" 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl transition-all duration-200 shadow-elevation-low"
        >
          <Plus className="w-5 h-5" />
          New Project
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl bg-surface/50">
          <p className="text-secondary text-lg mb-6">You haven&apos;t created any projects yet.</p>
          <Link 
            href="/projects/new" 
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-border text-primary font-medium rounded-xl hover:text-accent hover:border-accent transition-all duration-200 shadow-elevation-low"
          >
            Create your first project
          </Link>
        </div>
      )}
    </div>
  );
}
