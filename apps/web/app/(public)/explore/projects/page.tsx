import { Metadata } from 'next';
import { searchProjects } from '../../../../src/server/services/discoveryService';
import { ProjectCard } from '../../../../src/components/discovery/ProjectCard';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore Projects | CodeSync',
  description: 'Discover open projects and find your next collaboration opportunity on CodeSync.',
  alternates: {
    canonical: '/explore/projects',
  },
};

export default async function PublicProjectsExplore({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;

  // Call the existing service directly, passing null for userId to run unauthenticated
  const { items: projects } = await searchProjects(null, { 
    q, 
    limit: 20, 
    sort: 'recency' 
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">
          Explore Projects
        </h1>
        <p className="text-secondary text-lg">
          Find open projects looking for your skills.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <form method="GET" action="/explore/projects" className="relative w-full max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search projects..."
            className="w-full bg-surface border border-border text-primary placeholder:text-muted rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat"
          />
        </form>

        {projects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
            <p className="text-secondary text-lg mb-2">No projects found matching your criteria.</p>
            <p className="text-muted">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
