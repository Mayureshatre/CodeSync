
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState('');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-skills'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/skills');
      if (!res.ok) throw new Error('Failed to fetch skills');
      return res.json();
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, action, targetSkillId }: { id: string, action: string, targetSkillId?: string }) => {
      const res = await fetch(`/api/v1/admin/skills/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetSkillId })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to resolve skill');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-skills'] });
      setTargetId('');
    }
  });

  if (isLoading) return <div className="p-4">Loading skills...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading skills</div>;

  const skills = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pending Skills</h1>
      {resolveMutation.error && <div className="bg-red-50 text-red-600 p-3 rounded">{(resolveMutation.error as Error).message}</div>}
      
      {skills.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-gray-500 text-center">No pending skills.</div>
      ) : (
        <div className="grid gap-4">
          {skills.map((s: any) => (
            <div key={s.id} className="bg-white p-4 rounded shadow flex items-center justify-between">
              <div>
                <span className="font-medium text-lg">{s.name}</span>
                <span className="text-sm text-gray-500 ml-2">ID: {s.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => resolveMutation.mutate({ id: s.id, action: 'approve' })}
                  disabled={resolveMutation.isPending}
                  className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm"
                >Approve</button>
                <button 
                  onClick={() => resolveMutation.mutate({ id: s.id, action: 'reject' })}
                  disabled={resolveMutation.isPending}
                  className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm"
                >Reject</button>
                
                <div className="flex items-center space-x-2 ml-4 border-l pl-4">
                  <input 
                    type="text" 
                    placeholder="Target Skill ID" 
                    className="border p-1 text-sm rounded w-32"
                    onChange={(e) => setTargetId(e.target.value)}
                  />
                  <button 
                    onClick={() => resolveMutation.mutate({ id: s.id, action: 'merge', targetSkillId: targetId })}
                    disabled={!targetId || resolveMutation.isPending}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded text-sm disabled:opacity-50"
                  >Merge</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
