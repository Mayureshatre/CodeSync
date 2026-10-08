'use client';

import React, { useEffect, useState } from 'react';
import { User, Check, X, Clock } from 'lucide-react';

interface Application {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  message?: string;
  role?: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    email: string;
    profile?: {
      displayName: string;
      avatarUrl?: string;
    };
  };
  createdAt: string;
}

export function ApplicationList({ projectId }: { projectId: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [projectId]);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/applications`);
      if (!res.ok) throw new Error('Failed to load applications');
      const json = await res.json();
      setApplications(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to update application');
      }
      // Optimistic update
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-secondary">
        Loading applications...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-2xl bg-surface/30">
        <p className="text-secondary">No applications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-xl font-bold tracking-tight text-primary mb-4">Applications</h3>
      {applications.map((app) => (
        <div key={app.id} className="bg-surface p-5 rounded-xl border border-border shadow-elevation-low">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
                {app.user.profile?.avatarUrl ? (
                  <img src={app.user.profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-primary">
                  {app.user.profile?.displayName || app.user.email}
                </p>
                <div className="flex items-center gap-2 text-sm text-secondary mt-0.5">
                  <span className="capitalize">{app.status}</span>
                  {app.role && (
                    <>
                      <span>•</span>
                      <span>Role: {app.role.title}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                {app.message && (
                  <p className="text-primary text-sm mt-3 bg-surface-elevated p-3 rounded-lg border border-border leading-relaxed">
                    &quot;{app.message}&quot;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              {app.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(app.id, 'accepted')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(app.id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </>
              )}
              {app.status === 'accepted' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Accepted
                </span>
              )}
              {app.status === 'rejected' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-sm font-medium">
                  <X className="w-4 h-4" />
                  Declined
                </span>
              )}
              {app.status === 'withdrawn' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Withdrawn
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
