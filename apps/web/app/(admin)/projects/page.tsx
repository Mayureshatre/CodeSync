
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Project Moderation</h1>
      
      <input 
        type="text" 
        placeholder="Search projects..." 
        className="w-full border p-2 rounded"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {moderateMutation.error && <div className="bg-red-50 text-red-600 p-3 rounded">{(moderateMutation.error as Error).message}</div>}

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Hidden</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((p: any) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.owner?.email}</td>
                <td className="px-6 py-4 text-sm">
                  {p.moderationHidden ? <span className="text-red-600 font-bold">Yes</span> : 'No'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                  <button 
                    onClick={() => {
                      const reason = prompt(`Reason to ${p.moderationHidden ? 'unhide' : 'hide'}:`);
                      if (reason) moderateMutation.mutate({ id: p.id, hidden: !p.moderationHidden, reason });
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                    disabled={moderateMutation.isPending}
                  >
                    {p.moderationHidden ? 'Unhide' : 'Hide'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
