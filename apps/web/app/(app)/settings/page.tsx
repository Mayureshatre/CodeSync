'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShieldAlert,
  Trash2,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Bell,
  UserX
} from 'lucide-react';

interface AccountStatus {
  id: string;
  email: string;
  status: string;
  deletionRequestedAt: string | null;
  graceDays: number;
  scheduledHardDeleteAt: string | null;
}

export default function AccountSettingsPage() {
  const { data: session, update } = useSession();

  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/users/me/status');
      if (res.ok) {
        const data = await res.json();
        setAccountStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDeleteRequest = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/v1/users/me/delete', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to request account deletion');
      }

      const updated = await res.json();
      setSuccess(`Account deletion scheduled. You have ${updated.graceDays} days to restore your account.`);
      setShowConfirmModal(false);
      await update();
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule deletion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreRequest = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/v1/users/me/restore', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to restore account');
      }

      setSuccess('Your account has been successfully restored.');
      await update();
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to restore account');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const isPendingDeletion = accountStatus?.status === 'pending_deletion';

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Account Settings</h1>
        <p className="text-secondary text-sm">Manage your account security and lifecycle settings.</p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border gap-6">
        <Link
          href="/settings"
          className="pb-3 border-b-2 border-accent text-accent font-medium text-sm flex items-center gap-2"
        >
          <UserX className="w-4 h-4" />
          Account & Deletion
        </Link>
        <Link
          href="/settings/notifications"
          className="pb-3 border-b-2 border-transparent text-secondary hover:text-primary font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Bell className="w-4 h-4" />
          Notifications
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-primary">Account Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-secondary block text-xs uppercase tracking-wider font-semibold mb-1">Email Address</span>
            <span className="text-primary font-medium">{accountStatus?.email || session?.user?.email}</span>
          </div>
          <div>
            <span className="text-secondary block text-xs uppercase tracking-wider font-semibold mb-1">Account Status</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPendingDeletion
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}>
              {isPendingDeletion ? 'Pending Deletion' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Deletion Alert / Actions */}
      {isPendingDeletion ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400">Account Deletion in Progress</h3>
              <p className="text-sm text-secondary">
                You requested account deletion on{' '}
                <strong>
                  {accountStatus?.deletionRequestedAt
                    ? new Date(accountStatus.deletionRequestedAt).toLocaleDateString()
                    : 'recently'}
                </strong>.
              </p>
              {accountStatus?.scheduledHardDeleteAt && (
                <p className="text-sm text-secondary">
                  Your account is scheduled for permanent hard deletion on{' '}
                  <strong className="text-primary">
                    {new Date(accountStatus.scheduledHardDeleteAt).toLocaleString()}
                  </strong>.
                </p>
              )}
              <p className="text-xs text-secondary pt-2">
                You can cancel this deletion request and restore full access at any time before the grace period ends.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={handleRestoreRequest}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 min-h-[44px]"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Restore Account
            </button>
          </div>
        </div>
      ) : (
        /* Danger Zone: Delete Account */
        <div className="bg-surface rounded-2xl border border-error/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-error/10 text-error">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Danger Zone</h2>
              <p className="text-secondary text-sm">Permanent actions regarding your account.</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm text-primary">Delete CodeSync Account</p>
              <p className="text-xs text-secondary max-w-md">
                Soft-deletes your account with a {accountStatus?.graceDays || 30}-day grace period. After the grace period, all personal data and resumes are permanently deleted. Retained project records will be anonymized.
              </p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 text-sm font-semibold transition-colors min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-elevation-overlay space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-error/10 text-error">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-primary">Schedule Account Deletion?</h3>
            </div>

            <div className="text-sm text-secondary space-y-2">
              <p>
                Your account will be placed into a <strong>{accountStatus?.graceDays || 30}-day grace period</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>You can log in and restore your account at any time during the grace period.</li>
                <li>After the grace period expires, all personal PII, resumes, and credentials will be permanently erased.</li>
                <li>Your previous contributions and project memberships will remain intact under &quot;Former Collaborator&quot;.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-border text-secondary hover:text-primary font-medium text-sm transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRequest}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error hover:bg-error/90 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 min-h-[44px]"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
