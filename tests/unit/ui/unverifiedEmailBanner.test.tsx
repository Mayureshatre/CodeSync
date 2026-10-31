// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnverifiedEmailBanner } from '../../../apps/web/src/components/account/UnverifiedEmailBanner';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

describe('UnverifiedEmailBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when user is unauthenticated', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any);
    const { container } = render(<UnverifiedEmailBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when user email is verified', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'u1', email: 'verified@example.com', emailVerified: true } },
      status: 'authenticated',
    } as any);
    const { container } = render(<UnverifiedEmailBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner and resend button when user email is unverified', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'u1', email: 'unverified@example.com', emailVerified: false } },
      status: 'authenticated',
    } as any);

    render(<UnverifiedEmailBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Email Unverified:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend Verification Email/i })).toBeInTheDocument();
  });

  it('triggers resend API and enters cooldown on click', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'u1', email: 'unverified@example.com', emailVerified: false } },
      status: 'authenticated',
    } as any);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Verification link sent' }),
    });
    global.fetch = mockFetch;

    render(<UnverifiedEmailBanner />);
    const resendBtn = screen.getByRole('button', { name: /Resend Verification Email/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/resend-verification', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'unverified@example.com' }),
      }));
      expect(screen.getByText(/Verification link sent/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent(/Resend in \d+s/i);
    });
  });
});
