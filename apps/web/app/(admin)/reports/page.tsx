'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, ShieldAlertIcon, CheckIcon, XIcon } from 'lucide-react';

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
        Error loading reports
      </div>
    );
  }

  const reports = data?.data?.items || [];

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Reports Queue</h1>
        <p className="text-secondary mt-2">Review and resolve user-submitted moderation reports.</p>
      </div>
      
      <div className="bg-surface border border-border rounded-2xl shadow-elevation-flat overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-16 text-center text-secondary flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mb-4">
              <ShieldAlertIcon className="w-8 h-8 text-muted" />
            </div>
            <p className="text-lg font-medium text-primary mb-1">Queue is empty</p>
            <p className="text-sm">There are no open reports at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-elevated/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-surface-elevated/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary capitalize">{r.targetType}</div>
                      <div className="text-xs text-muted font-mono mt-0.5">{r.targetId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-secondary line-clamp-2 max-w-xs" title={r.reason}>{r.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary">{r.reporter.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedReport(r)} 
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-colors"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border shadow-elevation-overlay rounded-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Resolve Report</h2>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface-elevated"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-surface-elevated rounded-xl border border-border space-y-2">
                <p className="text-sm">
                  <span className="text-muted font-medium">Target:</span>{' '}
                  <span className="text-primary capitalize">{selectedReport.targetType}</span>{' '}
                  <span className="text-muted font-mono text-xs">({selectedReport.targetId})</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted font-medium">Reason:</span>{' '}
                  <span className="text-primary">{selectedReport.reason}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Resolution Notes (Required)</label>
                <textarea
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none shadow-elevation-flat"
                  rows={4}
                  placeholder="Explain the action taken..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              {resolveMutation.error && (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
                  {(resolveMutation.error as Error).message}
                </div>
              )}
            </div>

            <div className="px-6 py-5 bg-surface-elevated/50 border-t border-border flex items-center justify-end gap-3">
              <button 
                onClick={() => setSelectedReport(null)} 
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => resolveMutation.mutate({ id: selectedReport.id, status: 'dismissed', notes })}
                disabled={!notes.trim() || resolveMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-surface-elevated text-primary border border-border hover:border-muted rounded-xl shadow-elevation-low transition-all disabled:opacity-50"
              >
                Dismiss Report
              </button>
              <button 
                onClick={() => resolveMutation.mutate({ id: selectedReport.id, status: 'actioned', notes })}
                disabled={!notes.trim() || resolveMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white rounded-xl shadow-elevation-low hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" />
                Mark Actioned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
