'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Users, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PreviewCandidate {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  experienceLevel: string;
  availability: string;
  score: number;
  explanation: string;
}

export function MatchPreviewCard({ projectId }: { projectId: string }) {
  const [previews, setPreviews] = useState<PreviewCandidate[]>([]);
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/v1/projects/${projectId}/match-preview`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load candidate previews');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setPreviews(data.previews || []);
          setTotalMatched(data.totalMatched || 0);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-elevation-low overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-primary">Candidate Match Preview</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
            Draft Preview
          </span>
        </div>
        <p className="text-xs text-secondary">
          Estimated matches based on required skills & availability
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <p className="text-xs text-secondary">Calculating potential matches...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-xs text-error py-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : previews.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <Users className="w-8 h-8 mx-auto text-secondary/50" />
          <p className="text-sm font-medium text-primary">No matching developers found yet</p>
          <p className="text-xs text-secondary max-w-md mx-auto">
            Try adjusting your required skills or lowering the minimum proficiency in project settings so more developers qualify.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-secondary">
            <strong>{totalMatched}</strong> candidate{totalMatched === 1 ? '' : 's'} meet all required skills. Publishing this project will notify high-ranking matches.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {previews.map((c) => (
              <div
                key={c.userId}
                className="p-3.5 rounded-xl border border-border bg-background/50 flex flex-col justify-between gap-2.5 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {c.displayName ? c.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{c.displayName}</p>
                      <p className="text-xs text-secondary truncate">@{c.username}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-bold whitespace-nowrap">
                    {Math.round(c.score)}% Match
                  </span>
                </div>

                <p className="text-[11px] text-secondary line-clamp-1 italic">
                  &ldquo;{c.explanation}&rdquo;
                </p>

                <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-border/40">
                  <span className="capitalize">{c.experienceLevel}</span>
                  <Link
                    href={`/developers/${c.username}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
                  >
                    View profile <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
