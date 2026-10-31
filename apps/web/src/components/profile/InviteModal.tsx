'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Send } from 'lucide-react';

interface InviteModalProps {
  developerUserId: string;
  developerName: string;
  onClose: () => void;
}

export function InviteButton({
  developerUserId,
  developerName,
}: {
  developerUserId: string;
  developerName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-elevation-low min-h-[44px]"
      >
        <Send className="w-4 h-4" />
        Invite
      </button>

      {isOpen && (
        <InviteModal
          developerUserId={developerUserId}
          developerName={developerName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export function InviteModal({
  developerUserId,
  developerName,
  onClose,
}: InviteModalProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/v1/projects/me');
        if (!res.ok) {
          throw new Error('Failed to load your projects');
        }
        const data = await res.json();
        const userProjects = data.projects || [];
        setProjects(userProjects);
        if (userProjects.length > 0) {
          setSelectedProjectId(userProjects[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setIsLoadingProjects(false);
      }
    }

    loadProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project to invite this developer to');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/projects/${selectedProjectId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitedUserId: developerUserId,
          matchScoreSnapshot: 100,
          reasonSnapshot: {
            message: message || 'Join my project!',
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || data.error || 'Failed to send invitation');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      router.refresh();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-elevation-overlay p-6 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold tracking-tight text-primary mb-2">
          Invite to Project
        </h2>
        <p className="text-secondary mb-6">
          Invite <span className="font-semibold text-primary">{developerName}</span> to collaborate on one of your projects.
        </p>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="text-success font-medium text-lg mb-2">Invitation sent</div>
            <p className="text-secondary mb-6">
              Your invitation has been sent to {developerName}.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-all min-h-[44px]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-primary mb-1">
                Select Project <span className="text-error">*</span>
              </label>
              {isLoadingProjects ? (
                <div className="flex items-center gap-2 text-sm text-secondary py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  Loading your projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="p-3 bg-surface-elevated border border-border rounded-xl text-sm text-secondary">
                  You don&apos;t have any open projects yet.{' '}
                  <a href="/projects/new" className="text-accent underline">
                    Create a project
                  </a>{' '}
                  first.
                </div>
              ) : (
                <select
                  id="projectId"
                  name="projectId"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                  className="w-full bg-background border border-border text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                >
                  <option value="" disabled>
                    Select a project
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-primary mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Join my project! We could really use your skills..."
                className="w-full bg-background border border-border text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 resize-none"
              />
            </div>

            {error && (
              <div className="text-error text-sm p-3 bg-error/10 border border-error/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-border text-primary rounded-xl hover:bg-surface-elevated transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingProjects || projects.length === 0}
                className="px-5 py-2 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                Send Invitation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
