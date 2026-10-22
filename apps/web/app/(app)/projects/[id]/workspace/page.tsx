'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  LayoutDashboard,
  KanbanSquare,
  Flag,
  MessageSquare,
  CheckCircle2,
  Clock,
  Circle,
  Plus,
  X,
  UserPlus,
  AlertCircle,
  ArrowRight,
  Calendar,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: string;
  actorId: string;
  metadata: any;
  createdAt: string;
  workspace?: {
    project?: {
      projectMembers?: Array<{
        userId: string;
        user: {
          profile?: {
            displayName: string;
            username: string;
            avatarUrl?: string | null;
          };
        };
      }>;
    };
  };
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'chat'>('overview');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStatus, setTaskStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskFormError, setTaskFormError] = useState('');

  // Milestone form state
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneFormError, setMilestoneFormError] = useState('');

  // 1. Fetch Workspace Summary
  const { data: workspace, isLoading: isWorkspaceLoading, error: workspaceError } = useQuery({
    queryKey: ['workspace', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${params.id}/workspace`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch workspace');
      }
      return (await res.json()).data;
    }
  });

  // 2. Fetch Activity Events
  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['workspace-activity', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${params.id}/workspace/activity`);
      if (!res.ok) throw new Error('Failed to fetch activity');
      const json = await res.json();
      return json.data as ActivityItem[];
    }
  });

  // 3. Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; status: string; assigneeId?: string | null }) => {
      const res = await fetch(`/api/v1/projects/${params.id}/workspace/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', params.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity', params.id] });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskStatus('todo');
      setTaskAssigneeId('');
      setTaskFormError('');
    },
    onError: (err: any) => {
      setTaskFormError(err.message || 'Failed to create task');
    }
  });

  // 4. Update Task Status Mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, title, status, assigneeId }: { taskId: string; title: string; status: 'todo' | 'in_progress' | 'done'; assigneeId?: string | null }) => {
      const res = await fetch(`/api/v1/projects/${params.id}/workspace/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status, assigneeId }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', params.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity', params.id] });
    }
  });

  // 5. Create Milestone Mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: { title: string; targetDate?: string | null }) => {
      const res = await fetch(`/api/v1/projects/${params.id}/workspace/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : null
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create milestone');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', params.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity', params.id] });
      setIsMilestoneModalOpen(false);
      setMilestoneTitle('');
      setMilestoneDate('');
      setMilestoneFormError('');
    },
    onError: (err: any) => {
      setMilestoneFormError(err.message || 'Failed to create milestone');
    }
  });

  // 6. Toggle Milestone Completion Mutation
  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, title, targetDate, completed }: { milestoneId: string; title: string; targetDate?: string | null; completed: boolean }) => {
      const res = await fetch(`/api/v1/projects/${params.id}/workspace/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          targetDate: targetDate ? new Date(targetDate).toISOString() : null,
          completedAt: completed ? new Date().toISOString() : null
        }),
      });
      if (!res.ok) throw new Error('Failed to update milestone');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', params.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity', params.id] });
    }
  });

  if (isWorkspaceLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-secondary font-medium">Loading workspace...</p>
      </div>
    );
  }

  if (workspaceError || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-error/30 bg-error/5 rounded-2xl max-w-2xl mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-error mb-3" />
        <h2 className="text-lg font-bold text-primary mb-1">Unable to Load Workspace</h2>
        <p className="text-secondary text-sm mb-6">
          {(workspaceError as any)?.message || 'You must be an active project member to access this workspace.'}
        </p>
        <Link
          href={`/projects/${params.id}`}
          className="px-4 py-2 bg-surface border border-border hover:bg-background text-primary rounded-xl text-sm font-medium transition-colors"
        >
          Back to Project Details
        </Link>
      </div>
    );
  }

  const projectMembers = workspace.project?.projectMembers || [];

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-accent" />;
      case 'task_created':
        return <Plus className="w-4 h-4 text-secondary" />;
      case 'task_updated':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'milestone_completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      default:
        return <Circle className="w-4 h-4 text-muted" />;
    }
  };

  const getActivityDescription = (event: ActivityItem) => {
    const member = projectMembers.find((m: any) => m.userId === event.actorId)
      || event.workspace?.project?.projectMembers?.find(m => m.userId === event.actorId);
    const actorName = member?.user?.profile?.displayName || member?.user?.profile?.username || 'Team member';

    switch (event.type) {
      case 'member_joined':
        return `${actorName} joined the workspace`;
      case 'task_created':
        return `${actorName} created task "${event.metadata?.title || 'Untitled'}"`;
      case 'task_updated':
        if (event.metadata?.newStatus === 'done') {
          return `${actorName} completed task "${event.metadata?.title || 'Untitled'}"`;
        }
        return `${actorName} moved "${event.metadata?.title || 'Untitled'}" to ${event.metadata?.newStatus?.replace('_', ' ') || 'updated'}`;
      case 'milestone_completed':
        return `${actorName} reached milestone "${event.metadata?.title || 'Untitled'}"`;
      default:
        return event.metadata?.message || `${actorName} updated the project`;
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskFormError('Task title is required');
      return;
    }
    setTaskFormError('');
    createTaskMutation.mutate({
      title: taskTitle.trim(),
      status: taskStatus,
      assigneeId: taskAssigneeId || null,
    });
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) {
      setMilestoneFormError('Milestone title is required');
      return;
    }
    setMilestoneFormError('');
    createMilestoneMutation.mutate({
      title: milestoneTitle.trim(),
      targetDate: milestoneDate || null,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/projects/${params.id}`} className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline">
              {workspace.project?.name || 'Project'}
            </Link>
            <span className="text-muted text-xs">•</span>
            <span className="text-xs text-secondary">Active Workspace</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Workspace</h1>
          <p className="text-secondary mt-1 text-sm">Coordinate tasks, track milestones, and collaborate in one place.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium rounded-xl transition-all shadow-elevation-low flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
          <button
            onClick={() => setIsMilestoneModalOpen(true)}
            className="px-4 py-2 bg-surface hover:bg-surface-elevated border border-border text-primary text-sm font-medium rounded-xl transition-all shadow-elevation-low flex items-center gap-1.5"
          >
            <Flag className="w-4 h-4 text-muted" />
            Add Milestone
          </button>
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
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Activity Feed */}
              <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-primary">Activity Feed</h2>
                  <span className="text-xs text-muted">Latest project updates</span>
                </div>

                {isActivityLoading ? (
                  <div className="space-y-4 py-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-border/60" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 bg-border/60 rounded w-3/4" />
                          <div className="h-3 bg-border/40 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activityData && activityData.length > 0 ? (
                  <div className="space-y-4">
                    {activityData.map((event) => (
                      <div key={event.id} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-background/50 border border-border/60 hover:border-accent/30 transition-colors">
                        <div className="p-2 rounded-lg bg-surface border border-border text-primary mt-0.5">
                          {getActivityIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary leading-snug">
                            {getActivityDescription(event)}
                          </p>
                          <p className="text-xs text-muted mt-1">
                            {new Date(event.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 border-2 border-dashed border-border rounded-xl text-center">
                    <p className="text-secondary font-medium">No activity recorded yet</p>
                    <p className="text-sm text-muted mt-1">Actions taken in tasks and milestones will stream here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats & Collaborators */}
            <div className="space-y-6">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-elevation-flat">
                <h3 className="font-bold text-primary mb-4">Workspace Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary text-sm font-medium">To Do</span>
                    <span className="text-primary font-bold">{workspace.tasks?.filter((t: any) => t.status === 'todo').length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary text-sm font-medium">In Progress</span>
                    <span className="text-primary font-bold text-warning">{workspace.tasks?.filter((t: any) => t.status === 'in_progress').length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary text-sm font-medium">Completed Tasks</span>
                    <span className="text-primary font-bold text-success">{workspace.tasks?.filter((t: any) => t.status === 'done').length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary text-sm font-medium">Milestones</span>
                    <span className="text-primary font-bold">{workspace.milestones?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Collaborators List */}
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-elevation-flat">
                <h3 className="font-bold text-primary mb-4">Collaborators</h3>
                {projectMembers.length > 0 ? (
                  <div className="space-y-3">
                    {projectMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-2.5 bg-background rounded-xl border border-border">
                        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent border border-accent/25 flex items-center justify-center text-xs font-bold uppercase">
                          {member.user?.profile?.displayName?.[0] || member.user?.profile?.username?.[0] || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary truncate">
                            {member.user?.profile?.displayName || member.user?.profile?.username || 'Team Member'}
                          </p>
                          <p className="text-xs text-muted">Active Member</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No collaborators added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TASKS KANBAN TAB */}
        {activeTab === 'tasks' && (
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-elevation-flat overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-primary">Tasks Kanban</h2>
                <p className="text-xs text-secondary mt-0.5">Click any task arrow to advance its status</p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-4 py-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium rounded-xl transition-all shadow-elevation-low flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>

            <div className="flex gap-6 min-w-[800px] min-h-[500px]">
              {(['todo', 'in_progress', 'done'] as const).map(status => (
                <div key={status} className="flex-1 flex flex-col bg-surface-elevated/50 p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold text-primary capitalize text-sm">{status.replace('_', ' ')}</h3>
                    <span className="bg-surface border border-border text-muted text-xs font-bold px-2 py-0.5 rounded-full">
                      {workspace.tasks?.filter((t: any) => t.status === status).length || 0}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3">
                    {workspace.tasks?.filter((t: any) => t.status === status).map((task: any) => (
                      <div key={task.id} className="bg-background p-4 rounded-xl border border-border shadow-elevation-low hover:border-accent/40 hover:shadow-elevation-overlay transition-all group">
                        <p className="text-primary text-sm font-medium leading-snug group-hover:text-accent transition-colors">{task.title}</p>

                        <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            {getTaskStatusIcon(task.status)}
                            <span className="text-xs text-secondary capitalize">{task.status.replace('_', ' ')}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Advance status action */}
                            {status === 'todo' && (
                              <button
                                onClick={() => updateTaskMutation.mutate({ taskId: task.id, title: task.title, status: 'in_progress', assigneeId: task.assigneeId })}
                                title="Move to In Progress"
                                className="px-2 py-1 text-xs font-medium rounded bg-surface hover:bg-surface-elevated border border-border text-secondary hover:text-primary flex items-center gap-1 transition-colors"
                              >
                                <span>Start</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {status === 'in_progress' && (
                              <button
                                onClick={() => updateTaskMutation.mutate({ taskId: task.id, title: task.title, status: 'done', assigneeId: task.assigneeId })}
                                title="Move to Done"
                                className="px-2 py-1 text-xs font-medium rounded bg-success/10 hover:bg-success/20 border border-success/30 text-success flex items-center gap-1 transition-colors"
                              >
                                <span>Complete</span>
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            {status === 'done' && (
                              <button
                                onClick={() => updateTaskMutation.mutate({ taskId: task.id, title: task.title, status: 'todo', assigneeId: task.assigneeId })}
                                title="Reopen Task"
                                className="px-2 py-1 text-xs font-medium rounded bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-primary transition-colors"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!workspace.tasks || workspace.tasks.filter((t: any) => t.status === status).length === 0) && (
                      <div className="py-8 text-center rounded-xl border-2 border-dashed border-border/50">
                        <p className="text-muted text-xs font-medium">No tasks in this lane</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROADMAP MILESTONES TAB */}
        {activeTab === 'milestones' && (
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-primary">Roadmap Milestones</h2>
                <p className="text-xs text-secondary mt-0.5">Track key target milestones and delivery dates</p>
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(true)}
                className="px-4 py-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium rounded-xl transition-all shadow-elevation-low flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
            </div>

            <div className="space-y-4">
              {workspace.milestones?.map((m: any) => (
                <div key={m.id} className="bg-background p-5 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-elevation-low transition-all">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleMilestoneMutation.mutate({ milestoneId: m.id, title: m.title, targetDate: m.targetDate, completed: !m.completedAt })}
                      title={m.completedAt ? "Mark incomplete" : "Mark completed"}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        m.completedAt ? 'bg-success text-white border-success' : 'bg-surface border-border hover:border-accent text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <h4 className={`font-medium ${m.completedAt ? 'text-secondary line-through' : 'text-primary'}`}>{m.title}</h4>
                      {m.targetDate && (
                        <p className="text-xs text-muted flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Target: {new Date(m.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-10 sm:pl-0">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      m.completedAt ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'
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
                  <p className="text-sm text-muted mt-1">Break your project down into major roadmap milestones.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat min-h-[500px] flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-primary mb-2">Team Conversation</h2>
            <p className="text-sm text-secondary mb-6">Coordinate with your team using the real-time messages hub.</p>
            <div className="flex-1 border-2 border-dashed border-border rounded-xl flex items-center justify-center p-8 text-center">
              <div>
                <MessageSquare className="w-10 h-10 text-accent mx-auto mb-3" />
                <h3 className="font-bold text-primary mb-1">Project Direct Messages</h3>
                <p className="text-secondary text-sm max-w-sm mb-6">
                  Conversations with accepted project members are synchronized with your Messages inbox.
                </p>
                <Link
                  href="/messages"
                  className="px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium rounded-xl transition-all shadow-elevation-low inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open Messages Hub
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-elevation-overlay space-y-6 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-primary">Create New Task</h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-secondary hover:text-primary p-1.5 rounded-lg hover:bg-background transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {taskFormError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{taskFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Implement user authentication middleware"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Initial Lane
                </label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-primary text-sm focus:outline-none focus:border-accent"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Assignee (Optional)
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-primary text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m: any) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.profile?.displayName || m.user?.profile?.username || m.userId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-background border border-border hover:bg-surface text-secondary hover:text-primary rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-5 py-2 bg-accent hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-elevation-low flex items-center gap-1.5"
                >
                  {createTaskMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MILESTONE MODAL */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-elevation-overlay space-y-6 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-primary">Add Roadmap Milestone</h3>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="text-secondary hover:text-primary p-1.5 rounded-lg hover:bg-background transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {milestoneFormError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{milestoneFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Beta MVP Release"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 bg-background border border-border hover:bg-surface text-secondary hover:text-primary rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMilestoneMutation.isPending}
                  className="px-5 py-2 bg-accent hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-elevation-low flex items-center gap-1.5"
                >
                  {createMilestoneMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
