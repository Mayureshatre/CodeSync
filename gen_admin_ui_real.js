const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'apps/web/app/(admin)');

// 1. Reports Page
fs.writeFileSync(path.join(base, 'reports', 'page.tsx'), `
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string, status: string, notes: string }) => {
      const res = await fetch(\`/api/v1/admin/reports/\${id}/resolve\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNotes: notes })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to resolve');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
      setNotes('');
    }
  });

  if (isLoading) return <div className="p-4">Loading reports...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading reports</div>;

  const reports = data?.data?.items || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports Queue</h1>
      
      {reports.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-gray-500 text-center">No open reports.</div>
      ) : (
        <div className="bg-white shadow rounded overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{r.targetType}: {r.targetId}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{r.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{r.reporter.email}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => setSelectedReport(r)} className="text-indigo-600 hover:text-indigo-900">Resolve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Resolve Report</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Target: {selectedReport.targetType} ({selectedReport.targetId})</p>
              <p className="text-sm font-medium">Reason: {selectedReport.reason}</p>
            </div>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={3}
              placeholder="Resolution notes (required)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {resolveMutation.error && <p className="text-red-600 text-sm mb-4">{(resolveMutation.error as Error).message}</p>}
            <div className="flex justify-end space-x-3">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button 
                onClick={() => resolveMutation.mutate({ id: selectedReport.id, status: 'dismissed', notes })}
                disabled={!notes.trim() || resolveMutation.isPending}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              >Dismiss</button>
              <button 
                onClick={() => resolveMutation.mutate({ id: selectedReport.id, status: 'actioned', notes })}
                disabled={!notes.trim() || resolveMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded disabled:opacity-50"
              >Actioned</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// 2. Skills Page
fs.writeFileSync(path.join(base, 'skills', 'page.tsx'), `
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
      const res = await fetch(\`/api/v1/admin/skills/\${id}/resolve\`, {
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
`);

// 3. Users Page
fs.writeFileSync(path.join(base, 'users', 'page.tsx'), `
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q],
    queryFn: async () => {
      const res = await fetch(\`/api/v1/admin/users?q=\${encodeURIComponent(q)}\`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const res = await fetch(\`/api/v1/admin/users/\${id}/suspend\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to suspend user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const users = data?.data?.items || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Moderation</h1>
      
      <input 
        type="text" 
        placeholder="Search users..." 
        className="w-full border p-2 rounded"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {suspendMutation.error && <div className="bg-red-50 text-red-600 p-3 rounded">{(suspendMutation.error as Error).message}</div>}

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u: any) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.role}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={\`px-2 py-1 rounded text-xs \${u.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}\`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  {u.status !== 'suspended' && (
                    <button 
                      onClick={() => {
                        const reason = prompt('Reason for suspension:');
                        if (reason) suspendMutation.mutate({ id: u.id, reason });
                      }}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      disabled={suspendMutation.isPending}
                    >Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

// 4. Projects Page
fs.writeFileSync(path.join(base, 'projects', 'page.tsx'), `
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', q],
    queryFn: async () => {
      const res = await fetch(\`/api/v1/admin/projects?q=\${encodeURIComponent(q)}\`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, hidden, reason }: { id: string, hidden: boolean, reason: string }) => {
      const res = await fetch(\`/api/v1/admin/projects/\${id}/moderate\`, {
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
                      const reason = prompt(\`Reason to \${p.moderationHidden ? 'unhide' : 'hide'}:\`);
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
`);

// 5. Config Page
fs.writeFileSync(path.join(base, 'config', 'page.tsx'), `
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
                id={\`config-\${c.key}\`}
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById(\`config-\${c.key}\`) as HTMLInputElement).value;
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
`);

console.log('Real Admin UI generated');
