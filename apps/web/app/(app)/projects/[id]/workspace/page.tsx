'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'chat'>('overview');

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${params.id}/workspace`);
      if (!res.ok) throw new Error('Failed to fetch workspace');
      return (await res.json()).data;
    }
  });

  if (isLoading) return <div className="p-8">Loading workspace...</div>;
  if (!workspace) return <div className="p-8 text-red-500">Failed to load workspace</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Workspace</h1>
      </div>

      <div className="flex border-b space-x-4">
        {['overview', 'tasks', 'milestones', 'chat'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`py-2 px-4 border-b-2 font-medium capitalize ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
            <div className="text-gray-500">Activity feed placeholder (M10 MVP)</div>
          </div>
        )}
        {activeTab === 'tasks' && (
          <div className="bg-white p-6 rounded shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Tasks Kanban</h2>
            <div className="flex space-x-4">
               {['todo', 'in_progress', 'done'].map(status => (
                 <div key={status} className="flex-1 bg-gray-50 p-4 rounded min-h-[300px]">
                   <h3 className="font-medium text-gray-700 capitalize mb-4">{status.replace('_', ' ')}</h3>
                   {workspace.tasks?.filter((t: any) => t.status === status).map((t: any) => (
                     <div key={t.id} className="bg-white p-3 rounded shadow-sm border mb-2">{t.title}</div>
                   ))}
                 </div>
               ))}
            </div>
          </div>
        )}
        {activeTab === 'milestones' && (
          <div className="bg-white p-6 rounded shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Roadmap</h2>
            {workspace.milestones?.map((m: any) => (
              <div key={m.id} className="border p-4 rounded mb-2 flex justify-between">
                <span>{m.title}</span>
                <span className="text-sm text-gray-500">{m.completedAt ? 'Completed' : 'Pending'}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="bg-white p-6 rounded shadow-sm min-h-[500px]">
             <h2 className="text-xl font-semibold mb-4">Project Chat</h2>
             <div className="text-gray-500">Chat reused from M9 Messaging...</div>
          </div>
        )}
      </div>
    </div>
  );
}
