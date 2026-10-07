"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';

export function ApplyButton({ 
  projectId, 
  roleId, 
  roleTitle, 
  variant = 'primary' 
}: { 
  projectId: string, 
  roleId?: string | null, 
  roleTitle?: string, 
  variant?: 'primary' | 'secondary' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {variant === 'primary' ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex-1 sm:flex-none px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl flex items-center justify-center transition-all duration-200 shadow-elevation-low"
        >
          Apply
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 min-h-[44px] bg-surface border border-border text-primary text-sm font-medium rounded-lg hover:border-accent hover:text-accent transition-all"
        >
          Apply
        </button>
      )}
      
      {isOpen && (
        <ApplyModal 
          projectId={projectId} 
          roleId={roleId} 
          roleTitle={roleTitle} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}

export function ApplyModal({ 
  projectId, 
  roleId, 
  roleTitle, 
  onClose 
}: { 
  projectId: string, 
  roleId?: string | null, 
  roleTitle?: string, 
  onClose: () => void 
}) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const payload: any = { message };
      if (roleId) {
        payload.roleId = roleId;
      }
      const res = await fetch(`/api/v1/projects/${projectId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || data.error || 'Failed to submit application');
      }
      setIsSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-elevation-overlay p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-2">
          Apply for Project
        </h2>
        {roleTitle ? (
          <p className="text-secondary mb-6">Applying for the role of <span className="font-semibold text-primary">{roleTitle}</span></p>
        ) : (
          <p className="text-secondary mb-6">Send an application to join this workspace.</p>
        )}

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="text-success font-medium text-lg mb-2">Application submitted</div>
            <p className="text-secondary mb-6">The project owner will review your application.</p>
            <button onClick={onClose} className="px-5 py-2.5 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-all">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-primary mb-1">
                Message <span className="text-error">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                minLength={10}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I would love to help! Here is why I am a good fit..."
                className="w-full bg-background border border-border text-primary rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              />
              <p className="text-xs text-muted mt-1">Minimum 10 characters.</p>
            </div>
            
            {error && <div className="text-error text-sm p-3 bg-error/10 border border-error/20 rounded-lg">{error}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 border border-border text-primary rounded-xl hover:bg-surface-elevated transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="px-5 py-2 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center">
                {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                Submit Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
