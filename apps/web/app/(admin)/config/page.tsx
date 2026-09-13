
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

  if (isLoading) return <div className="p-4">Loading config...</div>;

  const configs = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Config (Admins Only)</h1>
      
      {configMutation.error && <div className="bg-red-50 text-red-600 p-3 rounded">{(configMutation.error as Error).message}</div>}

      <div className="bg-white shadow rounded p-6 space-y-4">
        {configs.map((c: any) => (
          <div key={c.id} className="flex flex-col space-y-1 pb-4 border-b">
            <span className="font-medium text-gray-700">{c.key}</span>
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                defaultValue={c.value} 
                className="border p-2 rounded flex-1"
                id={`config-${c.key}`}
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById(`config-${c.key}`) as HTMLInputElement).value;
                  configMutation.mutate({ key: c.key, value: val });
                }}
                disabled={configMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >Save</button>
            </div>
          </div>
        ))}
        
        <div className="pt-4 flex flex-col space-y-1">
          <span className="font-medium text-gray-700">Add New Key</span>
          <div className="flex items-center space-x-2">
            <input type="text" placeholder="Key" id="new-key" className="border p-2 rounded flex-1" />
            <input type="text" placeholder="Value" id="new-val" className="border p-2 rounded flex-1" />
            <button 
              onClick={() => {
                const key = (document.getElementById('new-key') as HTMLInputElement).value;
                const val = (document.getElementById('new-val') as HTMLInputElement).value;
                if (key && val) configMutation.mutate({ key, value: val });
              }}
              disabled={configMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
