import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ProjectSearchInput, DeveloperSearchInput } from '../lib/validations/discovery';

export function useMyProjects() {
  return useQuery({
    queryKey: ['myProjects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects/me');
      if (!res.ok) throw new Error('Failed to fetch user projects');
      const data = await res.json();
      return data.projects || [];
    }
  });
}

export function useDiscoverProjects(filters: Partial<ProjectSearchInput>) {
  return useInfiniteQuery({
    queryKey: ['discovery', 'projects', filters],
    queryFn: async ({ pageParam = '' }) => {
      const searchParams = new URLSearchParams();
      if (pageParam) searchParams.append('cursor', pageParam as string);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, String(value));
        }
      });

      const res = await fetch(`/api/v1/projects?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: '',
  });
}

export function useDiscoverDevelopers(filters: Partial<DeveloperSearchInput>) {
  return useInfiniteQuery({
    queryKey: ['discovery', 'developers', filters],
    queryFn: async ({ pageParam = '' }) => {
      const searchParams = new URLSearchParams();
      if (pageParam) searchParams.append('cursor', pageParam as string);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, String(value));
        }
      });

      const res = await fetch(`/api/v1/developers?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch developers');
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: '',
  });
}

export function useRecommendedDevelopers(projectId: string | null) {
  return useInfiniteQuery({
    queryKey: ['discovery', 'matches', 'developers', projectId],
    queryFn: async ({ pageParam = '' }) => {
      if (!projectId) return { items: [], nextCursor: undefined };
      const searchParams = new URLSearchParams();
      searchParams.append('projectId', projectId);
      if (pageParam) searchParams.append('cursor', pageParam as string);

      const res = await fetch(`/api/v1/matches/developers?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch recommended developers');
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: '',
    enabled: !!projectId,
  });
}

export function useSaveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch('/api/v1/saved-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: projectId }),
      });
      if (!res.ok) throw new Error('Failed to save project');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries or optimistic update
    }
  });
}

export function useSaveDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (developerId: string) => {
      const res = await fetch('/api/v1/saved-developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: developerId }),
      });
      if (!res.ok) throw new Error('Failed to save developer');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
    }
  });
}
