export interface User {
  id: string;
  email: string;
  status: 'active' | 'suspended' | 'deleted' | 'pending_deletion';
}

export type Role = 'user' | 'moderator' | 'admin';
