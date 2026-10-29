// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/dist/client/components/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('../../../apps/web/src/hooks/useMessaging', () => ({
  useCreateConversation: vi.fn(),
}));

import { MessageButton } from '../../../apps/web/src/components/profile/MessageButton';
import { ProfileView } from '../../../apps/web/src/components/profile/ProfileView';
import * as nextAuth from 'next-auth/react';
import * as messagingHooks from '../../../apps/web/src/hooks/useMessaging';

describe('MessageButton & ProfileView Integration', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(messagingHooks.useCreateConversation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  describe('MessageButton', () => {
    it('renders the Message button with accessible label when viewing another user', () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'viewer-user-1' } },
        status: 'authenticated',
      } as any);

      render(<MessageButton developerUserId="target-user-2" developerName="Alice" />);

      const button = screen.getByRole('button', { name: /message alice/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
    });

    it('returns null and does not render if viewer is the developer (own profile guard)', () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'user-1' } },
        status: 'authenticated',
      } as any);

      const { container } = render(
        <MessageButton developerUserId="user-1" developerName="Myself" />
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();
    });

    it('redirects unauthenticated visitor to /login upon clicking Message', () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      render(<MessageButton developerUserId="target-user-2" developerName="Bob" />);

      const button = screen.getByRole('button', { name: /message bob/i });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('creates/retrieves conversation and navigates to /messages?conversationId=... on success', async () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'viewer-user-1' } },
        status: 'authenticated',
      } as any);

      mockMutateAsync.mockResolvedValueOnce({
        id: 'conv-abc-123',
        type: 'dm',
      });

      render(<MessageButton developerUserId="target-user-2" developerName="Charlie" />);

      const button = screen.getByRole('button', { name: /message charlie/i });
      fireEvent.click(button);

      expect(mockMutateAsync).toHaveBeenCalledWith({ targetUserId: 'target-user-2' });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/messages?conversationId=conv-abc-123');
      });
    });

    it('displays loading state and disables the button against duplicate clicks while mutation is pending', () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'viewer-user-1' } },
        status: 'authenticated',
      } as any);

      vi.mocked(messagingHooks.useCreateConversation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      render(<MessageButton developerUserId="target-user-2" developerName="Dana" />);

      const button = screen.getByRole('button', { name: /message dana/i });
      expect(button).toBeDisabled();
      expect(screen.getByText('Starting...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('displays error feedback when conversation creation fails', async () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'viewer-user-1' } },
        status: 'authenticated',
      } as any);

      mockMutateAsync.mockRejectedValueOnce(new Error('Cannot create a conversation with yourself'));

      render(<MessageButton developerUserId="target-user-2" developerName="Eve" />);

      const button = screen.getByRole('button', { name: /message eve/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Cannot create a conversation with yourself');
      });
    });
  });

  describe('ProfileView Integration', () => {
    const mockProfile = {
      userId: 'dev-1',
      username: 'johndoe',
      displayName: 'John Doe',
      bio: 'Fullstack developer',
      availability: 'full_time',
      experienceLevel: 'senior',
      user: { userSkills: [] }
    };

    it('renders MessageButton when isOwner is false', () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'viewer-2' } },
        status: 'authenticated',
      } as any);

      render(<ProfileView profile={mockProfile} isOwner={false} />);

      expect(screen.getByRole('button', { name: /message john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /edit profile/i })).not.toBeInTheDocument();
    });

    it('strictly hides MessageButton when isOwner is true (own profile)', () => {
      vi.mocked(nextAuth.useSession).mockReturnValue({
        data: { user: { id: 'dev-1' } },
        status: 'authenticated',
      } as any);

      render(<ProfileView profile={mockProfile} isOwner={true} />);

      expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /edit profile/i })).toBeInTheDocument();
    });
  });
});
