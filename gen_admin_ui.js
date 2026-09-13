const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'apps/web/app/(admin)');
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Layout
fs.writeFileSync(path.join(base, 'layout.tsx'), `
import { ReactNode } from 'react';
import Link from 'next/link';
import { getCurrentSession } from '../../src/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
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
          {session.user.role === 'admin' && (
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
`);

const uiPages = ['reports', 'skills', 'users', 'projects', 'config'];
uiPages.forEach(p => ensureDir(path.join(base, p)));

fs.writeFileSync(path.join(base, 'reports', 'page.tsx'), `
'use client';
export default function ReportsPage() {
  return <div><h1 className="text-2xl font-bold mb-4">Reports Queue</h1><div className="bg-white p-4 rounded shadow">Reports implementation placeholder (M11)</div></div>;
}
`);

fs.writeFileSync(path.join(base, 'skills', 'page.tsx'), `
'use client';
export default function SkillsPage() {
  return <div><h1 className="text-2xl font-bold mb-4">Pending Skills</h1><div className="bg-white p-4 rounded shadow">Skills moderation placeholder (M11)</div></div>;
}
`);

fs.writeFileSync(path.join(base, 'users', 'page.tsx'), `
'use client';
export default function UsersPage() {
  return <div><h1 className="text-2xl font-bold mb-4">User Moderation</h1><div className="bg-white p-4 rounded shadow">User suspension placeholder (M11)</div></div>;
}
`);

fs.writeFileSync(path.join(base, 'projects', 'page.tsx'), `
'use client';
export default function ProjectsPage() {
  return <div><h1 className="text-2xl font-bold mb-4">Project Moderation</h1><div className="bg-white p-4 rounded shadow">Project hiding placeholder (M11)</div></div>;
}
`);

fs.writeFileSync(path.join(base, 'config', 'page.tsx'), `
'use client';
export default function ConfigPage() {
  return <div><h1 className="text-2xl font-bold mb-4">Platform Config</h1><div className="bg-white p-4 rounded shadow">Config editor placeholder (M11)</div></div>;
}
`);

console.log('UI generated');
