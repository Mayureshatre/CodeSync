
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
      const res = await fetch(`/api/v1/admin/reports/${id}/resolve`, {
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
