'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, LayoutDashboard, KanbanSquare, Flag, MessageSquare, CheckCircle2, Clock, Circle } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-secondary font-medium">Loading workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-error/30 bg-error/5 rounded-2xl">
        <p className="text-error font-medium">Failed to load workspace.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: KanbanSquare },
    { id: 'milestones', label: 'Roadmap', icon: Flag },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ] as const;

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-warning" />;
      default: return <Circle className="w-4 h-4 text-muted" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Workspace</h1>
          <p className="text-secondary mt-1">Manage tasks, milestones, and team collaboration.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button 
            key={id}
            onClick={() => setActiveTab(id)}
            className={`pb-3 font-medium text-sm transition-all relative flex items-center gap-2 whitespace-nowrap ${
              activeTab === id ? 'text-accent' : 'text-secondary hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {activeTab === id && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-accent rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat">
                <h2 className="text-xl font-bold tracking-tight text-primary mb-6">Activity Feed</h2>
                <div className="py-12 border-2 border-dashed border-border rounded-xl text-center">
                  <p className="text-secondary font-medium">Activity feed placeholder</p>
                  <p className="text-sm text-muted mt-1">Recent events will appear here.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-elevation-flat">
                <h3 className="font-bold text-primary mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary text-sm font-medium">Active Tasks</span>
                    <span className="text-primary font-bold">{workspace.tasks?.filter((t: any) => t.status === 'in_progress').length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary text-sm font-medium">Completed</span>
                    <span className="text-primary font-bold">{workspace.tasks?.filter((t: any) => t.status === 'done').length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight text-primary">Tasks Kanban</h2>
              <button className="px-4 py-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium rounded-xl transition-all shadow-elevation-low">
                New Task
              </button>
            </div>
            <div className="flex gap-6 min-w-[800px] min-h-[500px]">
               {['todo', 'in_progress', 'done'].map(status => (
                 <div key={status} className="flex-1 flex flex-col bg-surface-elevated/50 p-4 rounded-xl border border-border">
                   <div className="flex items-center justify-between mb-4 px-1">
                     <h3 className="font-semibold text-primary capitalize text-sm">{status.replace('_', ' ')}</h3>
                     <span className="bg-surface border border-border text-muted text-xs font-bold px-2 py-0.5 rounded-full">
                       {workspace.tasks?.filter((t: any) => t.status === status).length || 0}
                     </span>
                   </div>
                   
                   <div className="flex-1 space-y-3">
                     {workspace.tasks?.filter((t: any) => t.status === status).map((t: any) => (
                       <div key={t.id} className="bg-background p-4 rounded-xl border border-border shadow-elevation-low hover:border-accent/40 hover:shadow-elevation-overlay hover:-translate-y-0.5 transition-all cursor-pointer group">
                         <div className="flex items-start justify-between gap-3">
                           <p className="text-primary text-sm font-medium leading-snug group-hover:text-accent transition-colors">{t.title}</p>
                         </div>
                         <div className="mt-4 flex items-center justify-between">
                           {getTaskStatusIcon(t.status)}
                           {t.assigneeId && (
                             <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[10px] text-accent font-bold uppercase" title="Assigned">
                               {t.assigneeId.substring(0, 2)}
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                     {(!workspace.tasks || workspace.tasks.filter((t: any) => t.status === status).length === 0) && (
                       <div className="py-8 text-center rounded-xl border-2 border-dashed border-border/50">
                         <p className="text-muted text-xs font-medium">No tasks</p>
                       </div>
                     )}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold tracking-tight text-primary">Roadmap Milestones</h2>
              <button className="px-4 py-2 bg-surface-elevated hover:bg-background border border-border hover:border-accent hover:text-accent text-primary text-sm font-medium rounded-xl transition-all shadow-elevation-low">
                Add Milestone
              </button>
            </div>
            
            <div className="space-y-4">
              {workspace.milestones?.map((m: any) => (
                <div key={m.id} className="bg-background p-5 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-elevation-low transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                      m.completedAt ? 'bg-success/10 border-success text-success' : 'bg-surface border-border'
                    }`}>
                      {m.completedAt && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className={`font-medium ${m.completedAt ? 'text-secondary line-through' : 'text-primary'}`}>{m.title}</h4>
                      {m.description && <p className="text-sm text-secondary mt-1">{m.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-9 sm:pl-0">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      m.completedAt ? 'bg-success/5 border-success/20 text-success' : 'bg-warning/5 border-warning/20 text-warning'
                    }`}>
                      {m.completedAt ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {(!workspace.milestones || workspace.milestones.length === 0) && (
                <div className="py-16 border-2 border-dashed border-border rounded-xl text-center">
                  <Flag className="w-8 h-8 text-muted mx-auto mb-3" />
                  <p className="text-secondary font-medium">No milestones defined.</p>
                  <p className="text-sm text-muted mt-1">Break your project down into major goals.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat min-h-[500px] flex flex-col">
             <h2 className="text-xl font-bold tracking-tight text-primary mb-6">Project Chat</h2>
             <div className="flex-1 border-2 border-dashed border-border rounded-xl flex items-center justify-center">
               <div className="text-center">
                 <MessageSquare className="w-8 h-8 text-muted mx-auto mb-3" />
                 <p className="text-secondary font-medium">Chat is reused from Messaging</p>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
