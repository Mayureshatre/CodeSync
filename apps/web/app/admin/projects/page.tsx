'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchIcon, Loader2Icon, EyeOffIcon, EyeIcon } from 'lucide-react';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', q],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/projects?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, hidden, reason }: { id: string, hidden: boolean, reason: string }) => {
      const res = await fetch(`/api/v1/admin/projects/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden, reason })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to moderate project');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    }
  });

  const projects = data?.data?.items || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Project Moderation</h1>
        <p className="text-secondary mt-2">Oversee platform projects and manage visibility.</p>
      </div>
      
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <SearchIcon className="w-5 h-5 text-muted" />
        </div>
        <input 
          type="text" 
          placeholder="Search projects by name..." 
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-elevation-low"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {moderateMutation.error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
          {(moderateMutation.error as Error).message}
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl shadow-elevation-flat overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2Icon className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-secondary border-t border-border border-dashed m-4 rounded-xl">
            No projects found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-elevated/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p: any) => (
                  <tr key={p.id} className="hover:bg-surface-elevated/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary">{p.name}</div>
                      <div className="text-xs text-muted font-mono mt-0.5">{p.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary">{p.owner?.email || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.moderationHidden ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-error/10 text-error border border-error/20">
                          <EyeOffIcon className="w-3.5 h-3.5" /> Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-success/10 text-success border border-success/20">
                          <EyeIcon className="w-3.5 h-3.5" /> Public
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={() => {
                          const reason = prompt(`Reason to ${p.moderationHidden ? 'unhide' : 'hide'} project:`);
                          if (reason) moderateMutation.mutate({ id: p.id, hidden: !p.moderationHidden, reason });
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-transparent ${
                          p.moderationHidden
                            ? 'text-accent hover:bg-accent/10 hover:border-accent/20'
                            : 'text-error hover:bg-error/10 hover:border-error/20'
                        }`}
                        disabled={moderateMutation.isPending}
                      >
                        {p.moderationHidden ? (
                          <><EyeIcon className="w-4 h-4" /> Unhide</>
                        ) : (
                          <><EyeOffIcon className="w-4 h-4" /> Hide</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
