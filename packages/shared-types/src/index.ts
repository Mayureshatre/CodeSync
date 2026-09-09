export interface User {
  id: string;
  email: string;
  status: 'active' | 'suspended' | 'deleted' | 'pending_deletion';
}

export type Role = 'user' | 'moderator' | 'admin';

export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'interviewing' | 'accepted' | 'rejected' | 'withdrawn';
export type InvitationStatus = 'invited' | 'accepted' | 'declined';
export type ActorRole = 'owner' | 'developer';

export function getAvailableApplicationActions(status: ApplicationStatus, actorRole: ActorRole): ApplicationStatus[] {
  if (actorRole === 'developer') {
    if (['applied', 'under_review', 'shortlisted', 'interviewing'].includes(status)) {
      return ['withdrawn'];
    }
    return [];
  }

  if (actorRole === 'owner') {
    switch (status) {
      case 'applied':
        return ['under_review', 'shortlisted', 'interviewing', 'accepted', 'rejected'];
      case 'under_review':
        return ['shortlisted', 'interviewing', 'accepted', 'rejected'];
      case 'shortlisted':
        return ['interviewing', 'accepted', 'rejected'];
      case 'interviewing':
        return ['accepted', 'rejected'];
      default:
        return [];
    }
  }

  return [];
}

export function getAvailableInvitationActions(status: InvitationStatus, actorRole: ActorRole): InvitationStatus[] {
  if (actorRole === 'developer') {
    if (status === 'invited') {
      return ['accepted', 'declined'];
    }
    return [];
  }

  return [];
}
