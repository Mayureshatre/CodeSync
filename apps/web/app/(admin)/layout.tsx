import { ReactNode } from 'react';
import Link from 'next/link';
import { getCurrentSession } from '../../src/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsIcon, UsersIcon, ShieldAlertIcon, FolderIcon, LightbulbIcon, ActivityIcon } from 'lucide-react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session?.user || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'moderator')) {
    redirect('/');
  }

  const isAdmin = (session.user as any).role === 'admin';

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ActivityIcon className="w-6 h-6 text-accent" />
          <span className="text-xl font-bold text-primary tracking-tight">Admin Panel</span>
        </div>
        <nav className="p-4 space-y-1.5 flex-1">
          <Link href="/admin/reports" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors font-medium">
            <ShieldAlertIcon className="w-4 h-4" />
            Reports
          </Link>
          <Link href="/admin/skills" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors font-medium">
            <LightbulbIcon className="w-4 h-4" />
            Skills
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors font-medium">
            <UsersIcon className="w-4 h-4" />
            Users
          </Link>
          <Link href="/admin/projects" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors font-medium">
            <FolderIcon className="w-4 h-4" />
            Projects
          </Link>
          {isAdmin && (
            <Link href="/admin/config" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors font-medium">
              <SettingsIcon className="w-4 h-4" />
              Config
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
