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
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
        <p className="text-[#94a3b8]">Find your missing piece and connect with top talent.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#263042] pb-px">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-bold text-sm transition-colors relative ${
            activeTab === 'projects' ? 'text-[#06b6d4]' : 'text-[#94a3b8] hover:text-[#f1f5f9]'
          }`}
        >
          Projects
          {activeTab === 'projects' && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#06b6d4]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('developers')}
          className={`px-4 py-2 font-bold text-sm transition-colors relative ${
            activeTab === 'developers' ? 'text-[#06b6d4]' : 'text-[#94a3b8] hover:text-[#f1f5f9]'
          }`}
        >
          Developers
          {activeTab === 'developers' && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#06b6d4]" />
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] pl-10 pr-4 py-2 focus:outline-none focus:border-[#06b6d4] transition-colors"
          />
        </form>

        {activeTab === 'projects' ? (
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={projectFilters.difficulty[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, difficulty: e.target.value ? [e.target.value] : [] }))}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
            >
              <option value="">Any Difficulty</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="EXPERT">Expert</option>
            </select>
            <select
              value={projectFilters.availability[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, availability: e.target.value ? [e.target.value] : [] }))}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
            >
              <option value="">Any Commitment</option>
              <option value="part_time">Part Time</option>
              <option value="full_time">Full Time</option>
              <option value="hobby">Hobby</option>
            </select>
            <select
              value={projectFilters.projectType[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, projectType: e.target.value ? [e.target.value] : [] }))}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
            >
              <option value="">Any Project Type</option>
              <option value="open_source">Open Source</option>
              <option value="startup">Startup</option>
              <option value="hackathon">Hackathon</option>
            </select>
            <select
              value={projectFilters.duration[0] || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, duration: e.target.value ? [e.target.value] : [] }))}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
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
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] w-32"
            />
            <input
              type="text"
              placeholder="Skills (comma sep)"
              value={projectFilters.skills.join(',')}
              onChange={(e) => handleSkillsChange(setProjectFilters, e.target.value)}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] w-40"
            />
            <input
              type="number"
              placeholder="Min Team"
              value={projectFilters.teamSizeCurrent || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, teamSizeCurrent: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] w-24"
              min="1"
            />
            <input
              type="number"
              placeholder="Max Team"
              value={projectFilters.teamSizeTarget || ''}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, teamSizeTarget: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] w-24"
              min="1"
            />
            <select
              value={projectFilters.sort}
              onChange={(e) => setProjectFilters(prev => ({ ...prev, sort: e.target.value as any }))}
              className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] ml-auto"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="recent">Sort by Recent</option>
              <option value="popularity">Sort by Popularity</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 items-center bg-[#1e2433] p-4 rounded-[12px] border border-[#06b6d4]/30">
              <span className="text-sm font-bold text-[#06b6d4]">Recruiting For:</span>
              {isLoadingMyProjects ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#06b6d4]" />
              ) : myProjects?.length === 0 ? (
                <span className="text-sm text-[#94a3b8]">You have no active projects.</span>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-[#141822] border border-[#06b6d4]/50 text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
                >
                  <option value="">Select a Project (Optional)</option>
                  {myProjects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              {developerFilters.sort === 'relevance' && !selectedProjectId && (
                <span className="text-xs text-orange-400 max-w-sm">
                  Select a project to enable match recommendations. Showing recent developers instead.
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={developerFilters.experience[0] || ''}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, experience: e.target.value ? [e.target.value] : [] }))}
                className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
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
                className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
              >
                <option value="">Any Availability</option>
                <option value="open_to_projects">Open to Projects</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
              <select
                value={developerFilters.projectInterests[0] || ''}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, projectInterests: e.target.value ? [e.target.value] : [] }))}
                className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4]"
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
                className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] w-32"
              />
              <input
                type="text"
                placeholder="Skills (comma sep)"
                value={developerFilters.skills.join(',')}
                onChange={(e) => handleSkillsChange(setDeveloperFilters, e.target.value)}
                className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] w-40"
              />
              <select
                value={developerFilters.sort}
                onChange={(e) => setDeveloperFilters(prev => ({ ...prev, sort: e.target.value as any }))}
                className="bg-[#141822] border border-[#263042] text-[#f1f5f9] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#06b6d4] ml-auto"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'projects' && (
          <div>
            {projectsStatus === 'pending' ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#06b6d4]" /></div>
            ) : projectsStatus === 'error' ? (
              <div className="text-red-400 text-center py-12">Failed to load projects.</div>
            ) : projectsData?.pages[0]?.items.length === 0 ? (
              <div className="text-center py-12 text-[#94a3b8]">No projects found matching your criteria.</div>
            ) : (
              <div className="space-y-8">
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
                  <div className="flex justify-center">
                    <button
                      onClick={() => fetchNextProjects()}
                      disabled={isFetchingNextProjects}
                      className="px-6 py-2 bg-[#1e2433] text-white rounded-[8px] border border-[#263042] hover:bg-[#263042] transition-colors disabled:opacity-50 flex items-center gap-2"
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
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#06b6d4]" /></div>
            ) : developersStatus === 'error' ? (
              <div className="text-red-400 text-center py-12">Failed to load developers.</div>
            ) : developersData?.pages[0]?.items.length === 0 ? (
              <div className="text-center py-12 text-[#94a3b8]">No developers found matching your criteria.</div>
            ) : (
              <div className="space-y-8">
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
                  <div className="flex justify-center">
                    <button
                      onClick={() => fetchNextDevelopers()}
                      disabled={isFetchingNextDevelopers}
                      className="px-6 py-2 bg-[#1e2433] text-white rounded-[8px] border border-[#263042] hover:bg-[#263042] transition-colors disabled:opacity-50 flex items-center gap-2"
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
