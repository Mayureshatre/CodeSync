'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, LightbulbIcon, CheckIcon, XIcon, GitMergeIcon } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2Icon className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
        Error loading skills
      </div>
    );
  }

  const skills = data?.data || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Pending Skills</h1>
        <p className="text-secondary mt-2">Approve, reject, or merge user-submitted skills.</p>
      </div>

      {resolveMutation.error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
          {(resolveMutation.error as Error).message}
        </div>
      )}
      
      {skills.length === 0 ? (
        <div className="bg-surface border border-border shadow-elevation-flat rounded-2xl p-16 text-center text-secondary flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mb-4">
            <LightbulbIcon className="w-8 h-8 text-muted" />
          </div>
          <p className="text-lg font-medium text-primary mb-1">Queue is empty</p>
          <p className="text-sm">There are no pending skills at this time.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {skills.map((s: any) => (
            <div key={s.id} className="bg-surface border border-border p-5 rounded-2xl shadow-elevation-flat flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-border/80 hover:shadow-elevation-overlay">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-primary">{s.name}</span>
                  <span className="px-2 py-0.5 rounded bg-surface-elevated text-xs font-mono text-muted border border-border">ID: {s.id}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                <button 
                  onClick={() => resolveMutation.mutate({ id: s.id, action: 'approve' })}
                  disabled={resolveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success border border-success/20 hover:bg-success/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <CheckIcon className="w-4 h-4" />
                  Approve
                </button>
                <button 
                  onClick={() => resolveMutation.mutate({ id: s.id, action: 'reject' })}
                  disabled={resolveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error/10 text-error border border-error/20 hover:bg-error/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <XIcon className="w-4 h-4" />
                  Reject
                </button>
                
                <div className="flex items-center gap-2 pl-4 border-l border-border">
                  <input 
                    type="text" 
                    placeholder="Target ID" 
                    className="w-32 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-elevation-flat"
                    onChange={(e) => setTargetId(e.target.value)}
                  />
                  <button 
                    onClick={() => resolveMutation.mutate({ id: s.id, action: 'merge', targetSkillId: targetId })}
                    disabled={!targetId || resolveMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated text-primary border border-border hover:border-accent hover:text-accent rounded-lg text-sm font-medium transition-all disabled:opacity-50 shadow-elevation-low"
                  >
                    <GitMergeIcon className="w-4 h-4" />
                    Merge
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
