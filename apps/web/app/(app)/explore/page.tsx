'use client';

import React, { useState } from 'react';
import { useDiscoverProjects, useDiscoverDevelopers, useMyProjects } from '../../../src/hooks/useDiscovery';
import { ProjectCard } from '../../../src/components/discovery/ProjectCard';
import { DeveloperCard } from '../../../src/components/discovery/DeveloperCard';
import { Loader2, Search } from 'lucide-react';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'projects' | 'developers'>('projects');
  
  // Shared state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Project Context for Developers Tab
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { data: myProjects, isLoading: isLoadingMyProjects } = useMyProjects();
  
  // Project Filters
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
    difficulty: [],
    availability: [],
    category: [],
    duration: [],
    projectType: [],
    skills: [],
    teamSizeCurrent: undefined,
    teamSizeTarget: undefined,
    sort: 'relevance'
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
    experience: [],
    projectInterests: [],
    availability: [],
    skills: [],
    location: '',
    sort: 'relevance'
  });

  const {
    data: projectsData,
    fetchNextPage: fetchNextProjects,
    hasNextPage: hasNextProjects,
    isFetchingNextPage: isFetchingNextProjects,
    status: projectsStatus
  } = useDiscoverProjects({
    q: searchQuery,
    ...projectFilters
  });

  const {
    data: developersData,
    fetchNextPage: fetchNextDevelopers,
    hasNextPage: hasNextDevelopers,
    isFetchingNextPage: isFetchingNextDevelopers,
    status: developersStatus
  } = useDiscoverDevelopers({
    q: searchQuery,
    projectId: selectedProjectId || undefined,
    ...developerFilters
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSkillsChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: string) => {
    setter((prev: any) => ({
      ...prev,
      skills: value ? value.split(',').map(s => s.trim()) : []
    }));
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
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
              value={projectFilters.difficulty[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, difficulty: e.target.value ? [e.target.value] : [] }))}
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="">Any Difficulty</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="EXPERT">Expert</option>
            </select>
            <select
              value={projectFilters.availability[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, availability: e.target.value ? [e.target.value] : [] }))}
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="">Any Commitment</option>
              <option value="part_time">Part Time</option>
              <option value="full_time">Full Time</option>
              <option value="hobby">Hobby</option>
            </select>
            <select
              value={projectFilters.projectType[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, projectType: e.target.value ? [e.target.value] : [] }))}
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="">Any Project Type</option>
              <option value="open_source">Open Source</option>
              <option value="startup">Startup</option>
              <option value="hackathon">Hackathon</option>
            </select>
            <select
              value={projectFilters.duration[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, duration: e.target.value ? [e.target.value] : [] }))}
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
              value={projectFilters.category[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, category: e.target.value ? [e.target.value] : [] }))}
              className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-32"
            />
            <input
              type="text"
              placeholder="Skills (comma sep)"
              value={projectFilters.skills.join(',')}
              onChange={(e) => handleSkillsChange(setProjectFilters, e.target.value)}
              className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-40"
            />
            <input
              type="number"
              placeholder="Min Team"
              value={projectFilters.teamSizeCurrent || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, teamSizeCurrent: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-28"
              min="1"
            />
            <input
              type="number"
              placeholder="Max Team"
              value={projectFilters.teamSizeTarget || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, teamSizeTarget: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-28"
              min="1"
            />
            <select
              value={projectFilters.sort}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, sort: e.target.value as any }))}
              className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 ml-auto"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="recent">Sort by Recent</option>
              <option value="popularity">Sort by Popularity</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-4 items-center bg-surface-elevated p-4 rounded-2xl border border-accent/20 shadow-elevation-low">
              <span className="text-sm font-semibold text-accent">Recruiting For:</span>
              {isLoadingMyProjects ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : myProjects?.length === 0 ? (
                <span className="text-sm text-muted">You have no active projects.</span>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-background border border-border text-primary rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                >
                  <option value="">Select a Project (Optional)</option>
                  {myProjects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
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
                value={developerFilters.experience[0] || ''}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, experience: e.target.value ? [e.target.value] : [] }))}
                className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              >
                <option value="">Any Experience</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID_LEVEL">Mid-Level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead</option>
              </select>
              <select
                value={developerFilters.availability[0] || ''}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, availability: e.target.value ? [e.target.value] : [] }))}
                className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              >
                <option value="">Any Availability</option>
                <option value="open_to_projects">Open to Projects</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
              <select
                value={developerFilters.projectInterests[0] || ''}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, projectInterests: e.target.value ? [e.target.value] : [] }))}
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
                value={developerFilters.location}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, location: e.target.value }))}
                className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-32"
              />
              <input
                type="text"
                placeholder="Skills (comma sep)"
                value={developerFilters.skills.join(',')}
                onChange={(e) => handleSkillsChange(setDeveloperFilters, e.target.value)}
                className="bg-surface border border-border text-primary placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 w-40"
              />
              <select
                value={developerFilters.sort}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, sort: e.target.value as any }))}
                className="bg-surface border border-border text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 ml-auto"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="pt-4">
        {activeTab === 'projects' && (
          <div>
            {projectsStatus === 'pending' ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
            ) : projectsStatus === 'error' ? (
              <div className="text-error text-center py-16 bg-error/10 border border-error/20 rounded-2xl max-w-2xl mx-auto">Failed to load projects.</div>
            ) : projectsData?.pages[0]?.items.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <p className="text-secondary text-lg">No projects found matching your criteria.</p>
                <p className="text-muted mt-2">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
            ) : developersStatus === 'error' ? (
              <div className="text-error text-center py-16 bg-error/10 border border-error/20 rounded-2xl max-w-2xl mx-auto">Failed to load developers.</div>
            ) : developersData?.pages[0]?.items.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <p className="text-secondary text-lg">No developers found matching your criteria.</p>
                <p className="text-muted mt-2">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
