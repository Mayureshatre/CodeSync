
import { ReactNode } from 'react';
import Link from 'next/link';
import { getCurrentSession } from '../../src/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session?.user || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'moderator')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-4 text-xl font-bold border-b border-slate-700">Admin Panel</div>
        <nav className="p-4 space-y-2">
          <Link href="/admin/reports" className="block py-2 px-3 rounded hover:bg-slate-800">Reports</Link>
          <Link href="/admin/skills" className="block py-2 px-3 rounded hover:bg-slate-800">Skills</Link>
          <Link href="/admin/users" className="block py-2 px-3 rounded hover:bg-slate-800">Users</Link>
          <Link href="/admin/projects" className="block py-2 px-3 rounded hover:bg-slate-800">Projects</Link>
          {(session.user as any).role === 'admin' && (
            <Link href="/admin/config" className="block py-2 px-3 rounded hover:bg-slate-800">Config</Link>
          )}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
