import React from 'react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getCurrentSession } from '@/src/lib/auth';
import { InvitationList } from '@/src/components/invitation/InvitationList';

export const metadata: Metadata = {
  title: 'Invitations | CodeSync',
  description: 'Manage your project collaboration invitations',
};

export default async function InvitationsPage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Invitations</h1>
        <p className="text-secondary mt-1">Review and manage collaboration invitations sent to you.</p>
      </div>
      <InvitationList />
    </div>
  );
}
