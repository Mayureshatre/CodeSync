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
}));

describe('AppNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links and desktop logout button', () => {
    render(<AppNavbar />);

    expect(screen.getByText('CodeSync')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();

    const logoutButtons = screen.getAllByRole('button', { name: /log out/i });
    expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
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

    // Should immediately show loading state and disable the button
    expect(logoutButton).toBeDisabled();
    expect(screen.getByText('Logging out...')).toBeInTheDocument();

    // Secondary click should be ignored
    fireEvent.click(logoutButton);
    expect(nextAuth.signOut).toHaveBeenCalledTimes(1);

    resolveSignOut();
  });

  it('toggles mobile menu and allows logging out from mobile menu', async () => {
    vi.mocked(nextAuth.signOut).mockResolvedValue(undefined as any);

    render(<AppNavbar />);

    const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
    fireEvent.click(toggleButton);

    // Mobile menu is now open, so there should be 2 logout buttons (desktop + mobile)
    const logoutButtons = screen.getAllByRole('button', { name: /log out/i });
    expect(logoutButtons.length).toBe(2);

    const mobileLogout = logoutButtons[1];
    fireEvent.click(mobileLogout);

    expect(nextAuth.signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});
