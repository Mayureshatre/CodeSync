'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Check, X, MailOpen, Calendar, FolderKanban } from 'lucide-react';

interface Invitation {
  id: string;
  projectId: string;
  invitedUserId: string;
  invitedByUserId: string;
  roleId?: string | null;
  matchScoreSnapshot: number;
  reasonSnapshot?: {
    message?: string;
  } | any;
  status: 'invited' | 'accepted' | 'declined';
  createdAt: string;
  project: {
    id: string;
    name: string;
    description: string;
    slug: string;
    category?: string;
  };
  role?: {
    id: string;
    title: string;
  } | null;
}

export function InvitationList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/invitations');
      if (!res.ok) {
        throw new Error('Failed to load invitations');
      }
      const json = await res.json();
      setInvitations(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || json.error || 'Failed to respond to invitation');
      }

      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId
            ? { ...inv, status: action === 'accept' ? 'accepted' : 'declined' }
            : inv
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-secondary font-medium">Loading invitations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-error/30 bg-error/5 rounded-2xl p-8 max-w-2xl mx-auto text-center">
        <p className="text-error font-medium mb-4">{error}</p>
        <button
          onClick={fetchInvitations}
          className="px-5 py-2.5 bg-background border border-border text-primary font-medium rounded-xl hover:text-accent hover:border-accent transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl bg-surface/50 text-center p-8">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
          <MailOpen className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-primary mb-2">No invitations yet</h2>
        <p className="text-secondary text-sm max-w-md mb-6">
          When project owners invite you to collaborate, their invitations will appear here.
        </p>
        <Link
          href="/explore/projects"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl transition-all duration-200 shadow-elevation-low"
        >
          Explore Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-elevation-low transition-all duration-200"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-primary cursor-pointer hover:text-accent transition-colors">
                  {inv.project.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize border shadow-elevation-low ${
                    inv.status === 'accepted'
                      ? 'border-success/30 text-success bg-success/5'
                      : inv.status === 'declined'
                      ? 'border-error/30 text-error bg-error/5'
                      : 'border-accent/30 text-accent bg-accent/5'
                  }`}
                >
                  {inv.status}
                </span>
                {inv.project.category && (
                  <span className="px-3 py-1 bg-background text-secondary rounded-lg border border-border text-xs">
                    {inv.project.category}
                  </span>
                )}
                {inv.role && (
                  <span className="px-3 py-1 bg-surface-elevated text-primary rounded-lg border border-border text-xs font-medium">
                    Role: {inv.role.title}
                  </span>
                )}
              </div>

              {inv.project.description && (
                <p className="text-secondary text-sm leading-relaxed line-clamp-2">
                  {inv.project.description}
                </p>
              )}

              {inv.reasonSnapshot?.message && (
                <div className="bg-surface-elevated p-3.5 rounded-xl border border-border text-sm text-primary leading-relaxed">
                  <span className="text-xs text-muted block mb-1 font-medium">Message from project owner:</span>
                  &ldquo;{inv.reasonSnapshot.message}&rdquo;
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(inv.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/projects/${inv.project.slug}`}
                  className="text-accent hover:underline flex items-center gap-1"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  View Project
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center flex-shrink-0">
              {inv.status === 'invited' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRespond(inv.id, 'accept')}
                    disabled={actionLoading === inv.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-medium transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespond(inv.id, 'decline')}
                    disabled={actionLoading === inv.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </>
              )}

              {inv.status === 'accepted' && (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Accepted
                  </span>
                  <Link
                    href={`/projects/${inv.projectId}/workspace`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl text-sm transition-all shadow-elevation-low min-h-[44px]"
                  >
                    Workspace
                  </Link>
                </div>
              )}

              {inv.status === 'declined' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-sm font-medium">
                  <X className="w-4 h-4" />
                  Declined
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
