import Link from 'next/link';

export function ProfileView({ profile, isOwner }: { profile: any, isOwner: boolean }) {
  if (!profile) return <div className="text-primary text-center py-12">Profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Card */}
      <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center text-secondary text-2xl font-bold uppercase overflow-hidden border-2 border-border shadow-elevation-low">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                profile.displayName?.substring(0, 2) || profile.username.substring(0, 2)
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">{profile.displayName || profile.username}</h1>
              <p className="text-accent font-medium mb-3">@{profile.username}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                {profile.location && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border"></span>{profile.location}</span>}
                <span className="capitalize flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border"></span>{profile.availability.replace(/_/g, ' ')}</span>
                <span className="capitalize flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-border"></span>{profile.experienceLevel}</span>
              </div>
            </div>
          </div>
          {isOwner && (
            <Link
              href="/profile/edit"
              className="w-full sm:w-auto bg-surface-elevated border border-border hover:border-accent hover:text-accent text-primary font-medium py-2 px-5 rounded-xl transition-all duration-200 text-center shadow-elevation-low"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {profile.bio && (
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-sm font-medium text-primary mb-3">About</h3>
            <p className="text-secondary leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Links */}
        <div className="mt-8 flex flex-wrap gap-4">
          {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-secondary font-medium text-sm transition-colors">GitHub</a>}
          {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-secondary font-medium text-sm transition-colors">LinkedIn</a>}
          {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-secondary font-medium text-sm transition-colors">Portfolio</a>}
          {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-secondary font-medium text-sm transition-colors">Website</a>}
        </div>
      </div>

      {/* Skills Card */}
      <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay">
        <h2 className="text-xl font-bold tracking-tight text-primary mb-6">Technical Skills</h2>
        <div className="flex flex-wrap gap-3">
          {profile.user?.userSkills?.length > 0 ? (
            profile.user.userSkills.map((us: any) => (
              <div key={us.skillId} className="flex items-center bg-background border border-border text-primary px-4 py-2 rounded-xl text-sm shadow-elevation-low">
                <span className="w-2 h-2 rounded-full bg-accent mr-2.5"></span>
                <span className="font-medium mr-3">{us.skill.name}</span>
                <span className="text-secondary font-mono text-[10px] uppercase tracking-wider border-l border-border pl-3">{us.proficiency}</span>
              </div>
            ))
          ) : (
            <div className="w-full py-8 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-muted">No skills listed yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
