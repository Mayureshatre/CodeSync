
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/users?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const res = await fetch(`/api/v1/admin/users/${id}/suspend`, {
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
                  <span className={`px-2 py-1 rounded text-xs ${u.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
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
