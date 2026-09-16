import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Workspace | CodeSync',
};

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
