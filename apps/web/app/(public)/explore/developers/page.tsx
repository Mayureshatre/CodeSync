import { Metadata } from 'next';
import { searchDevelopers } from '../../../../src/server/services/discoveryService';
import { DeveloperCard } from '../../../../src/components/discovery/DeveloperCard';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore Developers | CodeSync',
  description: 'Discover talented developers and build your dream team on CodeSync.',
  alternates: {
    canonical: '/explore/developers',
  },
};

export default async function PublicDevelopersExplore({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;

  // Call the existing service directly, passing null for userId to run unauthenticated
  const { items: developers } = await searchDevelopers(null, { 
    q, 
    limit: 20, 
    sort: 'recency' 
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">
          Explore Developers
        </h1>
        <p className="text-secondary text-lg">
          Find your missing piece and connect with top talent.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <form method="GET" action="/explore/developers" className="relative w-full max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search developers..."
            className="w-full bg-surface border border-border text-primary placeholder:text-muted rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat"
          />
        </form>

        {developers.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
            <p className="text-secondary text-lg mb-2">No developers found matching your criteria.</p>
            <p className="text-muted">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developers.map((developer: any) => (
              <DeveloperCard key={developer.id || developer.profile?.userId} developer={developer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
