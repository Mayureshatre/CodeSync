// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppNavbar } from '../../../apps/web/src/components/navigation/AppNavbar';
import * as nextAuth from 'next-auth/react';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  usePathname: () => '/explore',
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

describe('AppNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'user-1', name: 'Elena' } },
        status: 'authenticated',
      } as any);
    });

    it('renders authenticated navigation links and desktop logout button', () => {
      render(<AppNavbar />);

      expect(screen.getByText('CodeSync')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /explore/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();

      const logoutButtons = screen.getAllByRole('button', { name: /log out/i });
      expect(logoutButtons.length).toBeGreaterThanOrEqual(1);

      // Sign in / Get Started should not appear for logged-in user
      expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
    });

    it('calls signOut with callbackUrl to home on logout click', async () => {
      vi.mocked(nextAuth.signOut).mockResolvedValue(undefined as any);

      render(<AppNavbar />);

      const logoutButton = screen.getAllByRole('button', { name: /log out/i })[0];
      fireEvent.click(logoutButton);

      expect(nextAuth.signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });

    it('prevents double-clicks and shows loading state while logout is in progress', async () => {
      let resolveSignOut: () => void = () => {};
      const pendingSignOut = new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });
      vi.mocked(nextAuth.signOut).mockReturnValue(pendingSignOut as any);

      render(<AppNavbar />);

      const logoutButton = screen.getAllByRole('button', { name: /log out/i })[0];
      fireEvent.click(logoutButton);

      expect(logoutButton).toBeDisabled();
      expect(screen.getByText('Logging out...')).toBeInTheDocument();

      fireEvent.click(logoutButton);
      expect(nextAuth.signOut).toHaveBeenCalledTimes(1);

      resolveSignOut();
    });

    it('toggles mobile menu and allows logging out from mobile menu', async () => {
      vi.mocked(nextAuth.signOut).mockResolvedValue(undefined as any);

      render(<AppNavbar />);

      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(toggleButton);

      const logoutButtons = screen.getAllByRole('button', { name: /log out/i });
      expect(logoutButtons.length).toBe(2);

      const mobileLogout = logoutButtons[1];
      fireEvent.click(mobileLogout);

      expect(nextAuth.signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);
    });

    it('renders public navigation links and login/register actions while omitting logout and private links', () => {
      render(<AppNavbar />);

      expect(screen.getByText('CodeSync')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /explore/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();

      // Protected routes must NOT appear
      expect(screen.queryByRole('link', { name: /messages/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /notifications/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();

      // Logout must NOT appear
      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();

      // Sign in and Get Started MUST appear
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: null,
        status: 'loading',
      } as any);
    });

    it('renders stable placeholder and avoids flashing logout or login while session is loading', () => {
      render(<AppNavbar />);

      expect(screen.getByText('CodeSync')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /explore/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();

      // No logout or sign-in buttons while loading
      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();

      // Placeholder exists to prevent layout shift
      expect(screen.getByTestId('navbar-auth-loading')).toBeInTheDocument();
    });
  });
});
