'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDiscoverProjects, useDiscoverDevelopers, useMyProjects } from '../../../src/hooks/useDiscovery';
import { ProjectCard } from '../../../src/components/discovery/ProjectCard';
import { DeveloperCard } from '../../../src/components/discovery/DeveloperCard';
import { DiscoveryGridSkeleton } from '../../../src/components/ui/Skeleton';
import { Loader2, Search, RotateCcw } from 'lucide-react';

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPendingTransition, startTransition] = useTransition();

  const initialTab = searchParams?.get('tab') === 'developers' ? 'developers' : 'projects';
  const [activeTab, setActiveTab] = useState<'projects' | 'developers'>(initialTab);

  // Shared search query
  const initialQ = searchParams?.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);

  // Project Context for Developers Tab
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    searchParams?.get('projectId') || ''
  );
  const { data: myProjects, isLoading: isLoadingMyProjects } = useMyProjects();

  // Project Filters
  const initialCategory = searchParams?.get('category');
  const initialDuration = searchParams?.get('duration');
  const initialDifficulty = searchParams?.get('difficulty');
  const initialAvailability = searchParams?.get('availability');
  const initialProjectType = searchParams?.get('projectType');

  const [projectFilters, setProjectFilters] = useState<{
    difficulty: string[];
    availability: string[];
    category: string[];
    duration: string[];
    projectType: string[];
    skills: string[];
    teamSizeCurrent: number | undefined;
    teamSizeTarget: number | undefined;
    sort: 'relevance' | 'recency' | 'popularity';
  }>({
    difficulty: initialDifficulty ? [initialDifficulty] : [],
    availability: initialAvailability ? [initialAvailability] : [],
    category: initialCategory ? [initialCategory] : [],
    duration: initialDuration ? [initialDuration] : [],
    projectType: initialProjectType ? [initialProjectType] : [],
    skills: searchParams?.get('skills') ? searchParams.get('skills')!.split(',') : [],
    teamSizeCurrent: undefined,
    teamSizeTarget: undefined,
    sort: 'relevance',
  });

  // Developer Filters
  const [developerFilters, setDeveloperFilters] = useState<{
    experience: string[];
    projectInterests: string[];
    availability: string[];
    skills: string[];
    location: string;
    sort: 'relevance' | 'recency' | 'popularity';
  }>({
    experience: searchParams?.get('experience') ? [searchParams.get('experience')!] : [],
    projectInterests: searchParams?.get('projectInterests') ? [searchParams.get('projectInterests')!] : [],
    availability: searchParams?.get('devAvailability') ? [searchParams.get('devAvailability')!] : [],
    skills: searchParams?.get('devSkills') ? searchParams.get('devSkills')!.split(',') : [],
    location: searchParams?.get('location') || '',
    sort: 'relevance',
  });

  // Debounce search query changes to prevent rapid request flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL without full-page navigation
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab === 'developers') params.set('tab', 'developers');
    if (debouncedQuery) params.set('q', debouncedQuery);

    if (activeTab === 'projects') {
      if (projectFilters.difficulty[0]) params.set('difficulty', projectFilters.difficulty[0]);
      if (projectFilters.availability[0]) params.set('availability', projectFilters.availability[0]);
      if (projectFilters.category[0]) params.set('category', projectFilters.category[0]);
      if (projectFilters.duration[0]) params.set('duration', projectFilters.duration[0]);
      if (projectFilters.projectType[0]) params.set('projectType', projectFilters.projectType[0]);
      if (projectFilters.skills.length > 0) params.set('skills', projectFilters.skills.join(','));
    } else {
      if (selectedProjectId) params.set('projectId', selectedProjectId);
      if (developerFilters.experience[0]) params.set('experience', developerFilters.experience[0]);
      if (developerFilters.availability[0]) params.set('devAvailability', developerFilters.availability[0]);
      if (developerFilters.projectInterests[0]) params.set('projectInterests', developerFilters.projectInterests[0]);
      if (developerFilters.location) params.set('location', developerFilters.location);
      if (developerFilters.skills.length > 0) params.set('devSkills', developerFilters.skills.join(','));
    }

    const queryStr = params.toString();
    const newRelativePathQuery = queryStr ? `/explore?${queryStr}` : '/explore';
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newRelativePathQuery);
    }
  }, [activeTab, debouncedQuery, projectFilters, developerFilters, selectedProjectId]);

  const {
    data: projectsData,
    fetchNextPage: fetchNextProjects,
    hasNextPage: hasNextProjects,
    isFetchingNextPage: isFetchingNextProjects,
    status: projectsStatus,
    isFetching: isFetchingProjects,
  } = useDiscoverProjects({
    q: debouncedQuery,
    ...projectFilters,
  });

  const {
    data: developersData,
    fetchNextPage: fetchNextDevelopers,
    hasNextPage: hasNextDevelopers,
    isFetchingNextPage: isFetchingNextDevelopers,
    status: developersStatus,
    isFetching: isFetchingDevelopers,
  } = useDiscoverDevelopers({
    q: debouncedQuery,
    projectId: selectedProjectId || undefined,
    ...developerFilters,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSkillsChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: string) => {
    setter((prev: any) => ({
      ...prev,
      skills: value ? value.split(',').map((s) => s.trim()) : [],
    }));
  };

  const hasActiveProjectFilters = Boolean(
    searchQuery ||
    projectFilters.difficulty.length ||
    projectFilters.availability.length ||
    projectFilters.category.length ||
    projectFilters.duration.length ||
    projectFilters.projectType.length ||
    projectFilters.skills.length
  );

  const clearProjectFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setProjectFilters({
      difficulty: [],
      availability: [],
      category: [],
      duration: [],
      projectType: [],
      skills: [],
      teamSizeCurrent: undefined,
      teamSizeTarget: undefined,
      sort: 'relevance',
    });
  };

  const hasActiveDeveloperFilters = Boolean(
    searchQuery ||
    selectedProjectId ||
    developerFilters.experience.length ||
    developerFilters.availability.length ||
    developerFilters.projectInterests.length ||
    developerFilters.location ||
    developerFilters.skills.length
  );

  const clearDeveloperFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedProjectId('');
    setDeveloperFilters({
      experience: [],
      projectInterests: [],
      availability: [],
      skills: [],
      location: '',
      sort: 'relevance',
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">Explore</h1>
        <p className="text-secondary text-lg">Find your missing piece and connect with top talent.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-border">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 font-medium text-sm transition-all relative ${
            activeTab === 'projects' ? 'text-accent' : 'text-secondary hover:text-primary'
          }`}
        >
          Projects
          {activeTab === 'projects' && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-accent rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('developers')}
          className={`pb-3 font-medium text-sm transition-all relative ${
            activeTab === 'developers' ? 'text-accent' : 'text-secondary hover:text-primary'
          }`}
        >
          Developers
          {activeTab === 'developers' && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-accent rounded-t-full" />
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-6">
        <form onSubmit={handleSearch} className="relative w-full max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border text-primary placeholder:text-muted rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat"
          />
        </form>

        {activeTab === 'projects' ? (
          <div className="flex flex-wrap gap-3 items-center">
            <select
              aria-label="Filter by Difficulty"
              value={projectFilters.difficulty[0] || ''}
              onChange={(e) =>
                setProjectFilters((prev) => ({
                  ...prev,
                  difficulty: e.target.value ? [e.target.value] : [],
                }))
              }
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="">Any Difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <select
              aria-label="Filter by Commitment"
              value={projectFilters.availability[0] || ''}
              onChange={(e) =>
                setProjectFilters((prev) => ({
                  ...prev,
                  availability: e.target.value ? [e.target.value] : [],
                }))
              }
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="">Any Commitment</option>
              <option value="part_time">Part Time</option>
              <option value="full_time">Full Time</option>
              <option value="hobby">Hobby</option>
            </select>
            <select
              aria-label="Filter by Project Type"
              value={projectFilters.projectType[0] || ''}
              onChange={(e) =>
                setProjectFilters((prev) => ({
                  ...prev,
                  projectType: e.target.value ? [e.target.value] : [],
                }))
              }
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="">Any Project Type</option>
              <option value="open_source">Open Source</option>
              <option value="startup">Startup</option>
              <option value="hackathon">Hackathon</option>
            </select>
            <select
              aria-label="Filter by Duration"
              value={projectFilters.duration[0] || ''}
              onChange={(e) =>
                setProjectFilters((prev) => ({
                  ...prev,
                  duration: e.target.value ? [e.target.value] : [],
                }))
              }
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="">Any Duration</option>
              <option value="less_than_1_month">&lt; 1 month</option>
              <option value="1_to_3_months">1 - 3 months</option>
              <option value="3_to_6_months">3 - 6 months</option>
              <option value="more_than_6_months">&gt; 6 months</option>
            </select>
            <input
              type="text"
              placeholder="Category"
              aria-label="Filter by Category"
              value={projectFilters.category[0] || ''}
              onChange={(e) =>
                setProjectFilters((prev) => ({
                  ...prev,
                  category: e.target.value ? [e.target.value] : [],
                }))
              }
              className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-36"
            />
            <input
              type="text"
              placeholder="Skills (comma sep)"
              aria-label="Filter by Skills"
              value={projectFilters.skills.join(',')}
              onChange={(e) => handleSkillsChange(setProjectFilters, e.target.value)}
              className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-40"
            />
            <select
              aria-label="Sort Projects"
              value={projectFilters.sort}
              onChange={(e) => setProjectFilters((prev) => ({ ...prev, sort: e.target.value as any }))}
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 ml-auto"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="recent">Sort by Recent</option>
              <option value="popularity">Sort by Popularity</option>
            </select>

            {hasActiveProjectFilters && (
              <button
                type="button"
                onClick={clearProjectFilters}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-primary px-3 py-2 rounded-lg border border-border hover:bg-surface-elevated transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-4 items-center bg-surface-elevated p-4 rounded-2xl border border-accent/20 shadow-elevation-low">
              <span className="text-sm font-semibold text-accent">Recruiting For:</span>
              {isLoadingMyProjects ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : myProjects?.length === 0 ? (
                <span className="text-sm text-secondary">You have no active projects.</span>
              ) : (
                <select
                  aria-label="Recruiting for Project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-background border border-border text-primary rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                >
                  <option value="">Select a Project (Optional)</option>
                  {myProjects?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {developerFilters.sort === 'relevance' && !selectedProjectId && (
                <span className="text-xs text-orange-500/80 max-w-sm ml-2">
                  Select a project to enable match recommendations. Showing recent developers instead.
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select
                aria-label="Filter by Experience"
                value={developerFilters.experience[0] || ''}
                onChange={(e) =>
                  setDeveloperFilters((prev) => ({
                    ...prev,
                    experience: e.target.value ? [e.target.value] : [],
                  }))
                }
                className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              >
                <option value="">Any Experience</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <select
                aria-label="Filter by Availability"
                value={developerFilters.availability[0] || ''}
                onChange={(e) =>
                  setDeveloperFilters((prev) => ({
                    ...prev,
                    availability: e.target.value ? [e.target.value] : [],
                  }))
                }
                className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              >
                <option value="">Any Availability</option>
                <option value="open_to_projects">Open to Projects</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
              <select
                aria-label="Filter by Interests"
                value={developerFilters.projectInterests[0] || ''}
                onChange={(e) =>
                  setDeveloperFilters((prev) => ({
                    ...prev,
                    projectInterests: e.target.value ? [e.target.value] : [],
                  }))
                }
                className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              >
                <option value="">Any Interests</option>
                <option value="open_source">Open Source</option>
                <option value="startup">Startup</option>
                <option value="hackathon">Hackathon</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                aria-label="Filter by Location"
                value={developerFilters.location}
                onChange={(e) =>
                  setDeveloperFilters((prev) => ({ ...prev, location: e.target.value }))
                }
                className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-32"
              />
              <input
                type="text"
                placeholder="Skills (comma sep)"
                aria-label="Filter by Developer Skills"
                value={developerFilters.skills.join(',')}
                onChange={(e) => handleSkillsChange(setDeveloperFilters, e.target.value)}
                className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-40"
              />
              <select
                aria-label="Sort Developers"
                value={developerFilters.sort}
                onChange={(e) =>
                  setDeveloperFilters((prev) => ({ ...prev, sort: e.target.value as any }))
                }
                className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 ml-auto"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="recent">Sort by Recent</option>
              </select>

              {hasActiveDeveloperFilters && (
                <button
                  type="button"
                  onClick={clearDeveloperFilters}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-primary px-3 py-2 rounded-lg border border-border hover:bg-surface-elevated transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="pt-4">
        {activeTab === 'projects' && (
          <div>
            {projectsStatus === 'pending' ? (
              <DiscoveryGridSkeleton type="projects" count={6} />
            ) : projectsStatus === 'error' ? (
              <div className="text-error text-center py-16 bg-error/10 border border-error/20 rounded-2xl max-w-2xl mx-auto">
                Failed to load projects.
              </div>
            ) : projectsData?.pages[0]?.items.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <p className="text-secondary text-lg">No projects found matching your criteria.</p>
                <p className="text-secondary mt-2">Try adjusting your filters or search terms.</p>
                {hasActiveProjectFilters && (
                  <button
                    type="button"
                    onClick={clearProjectFilters}
                    className="mt-4 px-4 py-2 bg-surface-elevated hover:bg-border text-primary rounded-xl text-sm font-medium transition-colors border border-border inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {isFetchingProjects && (
                  <div className="flex items-center gap-2 text-xs text-secondary animate-in fade-in duration-150">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>Updating results...</span>
                  </div>
                )}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
                    isFetchingProjects ? 'opacity-85' : 'opacity-100'
                  }`}
                >
                  {projectsData?.pages.map((page, i) => (
                    <React.Fragment key={i}>
                      {page.items.map((project: any) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                {hasNextProjects && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => fetchNextProjects()}
                      disabled={isFetchingNextProjects}
                      className="px-6 py-2.5 bg-surface-elevated text-primary font-medium rounded-xl border border-border hover:border-accent hover:text-accent transition-all duration-200 shadow-elevation-low disabled:opacity-50 disabled:hover:border-border disabled:hover:text-primary flex items-center gap-2"
                    >
                      {isFetchingNextProjects && <Loader2 className="w-4 h-4 animate-spin" />}
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'developers' && (
          <div>
            {developersStatus === 'pending' ? (
              <DiscoveryGridSkeleton type="developers" count={6} />
            ) : developersStatus === 'error' ? (
              <div className="text-error text-center py-16 bg-error/10 border border-error/20 rounded-2xl max-w-2xl mx-auto">
                Failed to load developers.
              </div>
            ) : developersData?.pages[0]?.items.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <p className="text-secondary text-lg">No developers found matching your criteria.</p>
                <p className="text-secondary mt-2">Try adjusting your filters or search terms.</p>
                {hasActiveDeveloperFilters && (
                  <button
                    type="button"
                    onClick={clearDeveloperFilters}
                    className="mt-4 px-4 py-2 bg-surface-elevated hover:bg-border text-primary rounded-xl text-sm font-medium transition-colors border border-border inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {isFetchingDevelopers && (
                  <div className="flex items-center gap-2 text-xs text-secondary animate-in fade-in duration-150">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>Updating results...</span>
                  </div>
                )}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
                    isFetchingDevelopers ? 'opacity-85' : 'opacity-100'
                  }`}
                >
                  {developersData?.pages.map((page, i) => (
                    <React.Fragment key={i}>
                      {page.items.map((developer: any) => (
                        <DeveloperCard key={developer.id} developer={developer} />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                {hasNextDevelopers && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => fetchNextDevelopers()}
                      disabled={isFetchingNextDevelopers}
                      className="px-6 py-2.5 bg-surface-elevated text-primary font-medium rounded-xl border border-border hover:border-accent hover:text-accent transition-all duration-200 shadow-elevation-low disabled:opacity-50 disabled:hover:border-border disabled:hover:text-primary flex items-center gap-2"
                    >
                      {isFetchingNextDevelopers && <Loader2 className="w-4 h-4 animate-spin" />}
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
