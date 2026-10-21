'use client';

import React, { useState } from 'react';
import { Loader2, X, Flag } from 'lucide-react';

interface ReportModalProps {
  targetType: 'user' | 'project' | 'message';
  targetId: string;
  targetName: string;
  onClose: () => void;
}

export function ReportButton({
  targetType = 'user',
  targetId,
  targetName,
}: {
  targetType?: 'user' | 'project' | 'message';
  targetId: string;
  targetName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Report"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 bg-surface-elevated hover:bg-error/10 hover:text-error text-secondary border border-border hover:border-error/30 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-elevation-low min-h-[44px]"
      >
        <Flag className="w-4 h-4" />
        <span className="hidden sm:inline">Report</span>
      </button>

      {isOpen && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          targetName={targetName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export function ReportModal({
  targetType,
  targetId,
  targetName,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || data.error || 'Failed to submit report');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-elevation-overlay p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="report-modal-title" className="text-2xl font-bold tracking-tight text-primary mb-2">
          Report {targetType === 'user' ? 'Developer' : targetType}
        </h2>
        <p className="text-secondary mb-6 text-sm">
          Submit a report for <span className="font-semibold text-primary">{targetName}</span>. Our moderation team will investigate.
        </p>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="text-success font-medium text-lg mb-2">Report submitted</div>
            <p className="text-secondary mb-6 text-sm">
              Thank you for helping keep CodeSync safe. Our moderation team will review your report.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-all min-h-[44px]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-primary mb-1">
                Reason <span className="text-error">*</span>
              </label>
              <select
                id="reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-background border border-border text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 text-sm"
              >
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-primary mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the issue..."
                className="w-full bg-background border border-border text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 resize-none text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-elevation-low min-h-[44px] disabled:opacity-50 text-sm"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
