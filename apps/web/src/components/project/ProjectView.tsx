import Link from 'next/link';

export function ProjectView({ project, isOwner }: { project: any, isOwner: boolean }) {
  if (!project) return <div className="text-white text-center py-10">Project not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="px-2 py-1 bg-[#1e2433] text-[#06b6d4] rounded-[4px] border border-[#263042] capitalize">{project.status.replace('_', ' ')}</span>
              <span className="text-[#94a3b8]">{project.category}</span>
              <span className="text-[#94a3b8]">Team: {project.teamSizeCurrent}/{project.teamSizeTarget}</span>
            </div>
          </div>
          {isOwner && (
            <div className="flex space-x-3">
              <Link href={`/projects/${project.id}/edit`} className="px-4 py-2 bg-transparent border border-[#263042] text-[#f1f5f9] rounded-[8px] hover:bg-[#1e2433] transition-colors">
                Edit
              </Link>
              {project.status === 'draft' && (
                <button className="px-4 py-2 bg-[#06b6d4] text-[#0a0e16] font-bold rounded-[8px] hover:bg-[#0891b2] transition-colors">
                  Publish
                </button>
              )}
            </div>
          )}
        </div>

        <div className="prose prose-invert max-w-none text-[#94a3b8]">
          <p>{project.description}</p>
          {project.problemStatement && (
            <>
              <h3 className="text-white mt-6 mb-2 text-lg font-medium">Problem Statement</h3>
              <p>{project.problemStatement}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#181c24] p-6 rounded-[12px] border border-[#263042]">
            <h3 className="text-xl font-bold text-white mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {project.projectSkills?.map((ps: any) => (
                <div key={ps.skillId} className={`px-3 py-1 rounded-[6px] border text-sm ${ps.requirementType === 'required' ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]' : 'bg-[#1e2433] border-[#263042] text-[#94a3b8]'}`}>
                  <span className="font-medium">{ps.skill?.name || ps.skillId}</span>
                  <span className="ml-2 text-xs opacity-70 capitalize">{ps.minProficiency}</span>
                </div>
              ))}
              {project.projectSkills?.length === 0 && <p className="text-[#64748b]">No specific skills required.</p>}
            </div>
          </div>

          <div className="bg-[#181c24] p-6 rounded-[12px] border border-[#263042]">
            <h3 className="text-xl font-bold text-white mb-4">Open Roles</h3>
            <div className="space-y-4">
              {project.projectRoles?.map((role: any) => (
                <div key={role.id} className="p-4 bg-[#141822] border border-[#263042] rounded-[8px]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[#f1f5f9] font-medium">{role.title}</h4>
                    <span className="text-[#06b6d4] text-sm">{role.slotsAvailable} slots</span>
                  </div>
                </div>
              ))}
              {project.projectRoles?.length === 0 && <p className="text-[#64748b]">No specific roles defined.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#181c24] p-6 rounded-[12px] border border-[#263042]">
            <h3 className="text-lg font-bold text-white mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[#64748b]">Owner</dt>
                <dd className="text-[#f1f5f9]">{project.owner?.profile?.displayName || project.owner?.email}</dd>
              </div>
              <div>
                <dt className="text-[#64748b]">Visibility</dt>
                <dd className="text-[#f1f5f9] capitalize">{project.visibility.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-[#64748b]">Collaboration</dt>
                <dd className="text-[#f1f5f9] capitalize">{project.collaborationType.join(', ').replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-[#64748b]">Remote</dt>
                <dd className="text-[#f1f5f9]">{project.remoteFlag ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
