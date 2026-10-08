'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, SaveIcon, PlusIcon, SettingsIcon } from 'lucide-react';

export default function ConfigPage() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    }
  });

  const configMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const res = await fetch('/api/v1/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update config');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-config'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2Icon className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const configs = data?.data || [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-accent" />
          Platform Config
        </h1>
        <p className="text-secondary mt-2">Manage global system variables. Admins only.</p>
      </div>
      
      {configMutation.error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
          {(configMutation.error as Error).message}
        </div>
      )}

      <div className="bg-surface border border-border shadow-elevation-flat rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          {configs.map((c: any) => (
            <div key={c.id} className="flex flex-col space-y-2 pb-5 border-b border-border">
              <span className="text-sm font-bold text-primary tracking-wide font-mono">{c.key}</span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input 
                  type="text" 
                  defaultValue={c.value} 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-elevation-low font-mono"
                  id={`config-${c.key}`}
                />
                <button 
                  onClick={() => {
                    const val = (document.getElementById(`config-${c.key}`) as HTMLInputElement).value;
                    configMutation.mutate({ key: c.key, value: val });
                  }}
                  disabled={configMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-elevated text-primary border border-border hover:border-accent hover:text-accent rounded-xl text-sm font-medium shadow-elevation-low transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <SaveIcon className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-2 flex flex-col space-y-3">
          <span className="text-sm font-bold text-primary tracking-wide">Add New Key</span>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input 
              type="text" 
              placeholder="KEY_NAME" 
              id="new-key" 
              className="w-full sm:w-1/3 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-elevation-low font-mono" 
            />
            <input 
              type="text" 
              placeholder="Value" 
              id="new-val" 
              className="w-full sm:flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-elevation-low font-mono" 
            />
            <button 
              onClick={() => {
                const keyInput = document.getElementById('new-key') as HTMLInputElement;
                const valInput = document.getElementById('new-val') as HTMLInputElement;
                const key = keyInput.value;
                const val = valInput.value;
                if (key && val) {
                  configMutation.mutate({ key, value: val }, {
                    onSuccess: () => {
                      keyInput.value = '';
                      valInput.value = '';
                    }
                  });
                }
              }}
              disabled={configMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium shadow-elevation-low hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
            >
              <PlusIcon className="w-4 h-4" />
              Add Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
