import Link from 'next/link';
import { Calendar, Users, MapPin, Globe, CheckCircle2 } from 'lucide-react';

export function ProjectView({ project, isOwner }: { project: any, isOwner: boolean }) {
  if (!project) return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl">
      <p className="text-secondary text-lg">Project not found.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Card */}
      <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay relative overflow-hidden">
        {/* Subtle top accent gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-4">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`px-3 py-1 bg-surface-elevated rounded-lg border shadow-elevation-low capitalize font-medium ${
                project.status === 'published' ? 'border-success/30 text-success bg-success/5' : 
                project.status === 'draft' ? 'border-warning/30 text-warning bg-warning/5' : 
                'border-border text-secondary'
              }`}>
                {project.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 bg-background text-secondary rounded-lg border border-border shadow-elevation-low">{project.category}</span>
              <span className="px-3 py-1 bg-background text-secondary rounded-lg border border-border shadow-elevation-low flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {project.teamSizeCurrent} / {project.teamSizeTarget} Team
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href={`/projects/${project.id}/edit`} className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-surface-elevated border border-border text-primary font-medium rounded-xl hover:text-accent hover:border-accent transition-all duration-200 shadow-elevation-low">
                Edit Workspace
              </Link>
              {project.status === 'draft' && (
                <button className="flex-1 sm:flex-none px-5 py-2.5 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium rounded-xl transition-all duration-200 shadow-elevation-low">
                  Publish
                </button>
              )}
            </div>
          )}
        </div>

        <div className="prose prose-invert max-w-none">
          <h3 className="text-xl font-bold text-primary mb-3">About the Project</h3>
          <p className="text-secondary leading-relaxed">{project.description}</p>
          
          {project.problemStatement && (
            <>
              <h3 className="text-xl font-bold text-primary mt-8 mb-3">Problem Statement</h3>
              <p className="text-secondary leading-relaxed">{project.problemStatement}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Required Skills */}
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat">
            <h3 className="text-xl font-bold tracking-tight text-primary mb-6">Required Skills</h3>
            <div className="flex flex-wrap gap-3">
              {project.projectSkills?.map((ps: any) => (
                <div key={ps.skillId} className={`px-4 py-2 rounded-xl border text-sm flex items-center shadow-elevation-low ${
                  ps.requirementType === 'required' ? 'bg-accent/5 border-accent/20 text-accent' : 'bg-surface-elevated border-border text-primary'
                }`}>
                  <span className="font-semibold">{ps.skill?.name || ps.skillId}</span>
                  <div className={`ml-3 pl-3 border-l text-xs uppercase tracking-wider font-mono ${
                    ps.requirementType === 'required' ? 'border-accent/20 text-accent' : 'border-border text-muted'
                  }`}>
                    {ps.minProficiency}
                  </div>
                </div>
              ))}
              {(!project.projectSkills || project.projectSkills.length === 0) && (
                <p className="text-muted text-sm italic">No specific technical skills required.</p>
              )}
            </div>
          </div>

          {/* Open Roles */}
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat">
            <h3 className="text-xl font-bold tracking-tight text-primary mb-6">Open Roles</h3>
            <div className="space-y-4">
              {project.projectRoles?.map((role: any) => (
                <div key={role.id} className="p-5 bg-background border border-border rounded-xl shadow-elevation-low flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-accent/30 transition-colors">
                  <div>
                    <h4 className="text-primary font-bold text-lg">{role.title}</h4>
                    {role.skills?.length > 0 && (
                      <p className="text-sm text-secondary mt-1">{role.skills.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-accent bg-accent/10 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap">
                      {role.slotsAvailable} slot{role.slotsAvailable !== 1 ? 's' : ''}
                    </span>
                    {!isOwner && (
                      <button className="px-4 py-1.5 bg-surface border border-border text-primary text-sm font-medium rounded-lg hover:border-accent hover:text-accent transition-all">
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!project.projectRoles || project.projectRoles.length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                  <p className="text-muted text-sm">No specific roles defined.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-elevation-flat">
            <h3 className="text-xl font-bold tracking-tight text-primary mb-6">Workspace Details</h3>
            <dl className="space-y-5">
              <div className="flex gap-4">
                <div className="mt-0.5 text-muted"><Users className="w-5 h-5" /></div>
                <div>
                  <dt className="text-sm font-medium text-secondary mb-0.5">Project Owner</dt>
                  <dd className="text-primary font-medium">{project.owner?.profile?.displayName || project.owner?.email}</dd>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-0.5 text-muted"><Globe className="w-5 h-5" /></div>
                <div>
                  <dt className="text-sm font-medium text-secondary mb-0.5">Visibility</dt>
                  <dd className="text-primary capitalize">{project.visibility.replace('_', ' ')}</dd>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-0.5 text-muted"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <dt className="text-sm font-medium text-secondary mb-0.5">Collaboration</dt>
                  <dd className="text-primary capitalize leading-relaxed">
                    {project.collaborationType?.join(', ').replace(/_/g, ' ') || 'None specified'}
                  </dd>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-0.5 text-muted"><MapPin className="w-5 h-5" /></div>
                <div>
                  <dt className="text-sm font-medium text-secondary mb-0.5">Work Style</dt>
                  <dd className="text-primary">{project.remoteFlag ? 'Remote Friendly' : 'On-site / Hybrid'}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
