import Link from 'next/link';

export function ProfileView({ profile, isOwner }: { profile: any, isOwner: boolean }) {
  if (!profile) return <div className="text-white text-center py-10">Profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042]">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-[#1e2433] flex items-center justify-center text-[#94a3b8] text-2xl font-bold uppercase overflow-hidden border-2 border-[#263042]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                profile.displayName?.substring(0, 2) || profile.username.substring(0, 2)
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{profile.displayName || profile.username}</h1>
              <p className="text-[#06b6d4]">@{profile.username}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-[#94a3b8]">
                {profile.location && <span>📍 {profile.location}</span>}
                <span className="capitalize">🚦 {profile.availability.replace(/_/g, ' ')}</span>
                <span className="capitalize">⭐ {profile.experienceLevel}</span>
              </div>
            </div>
          </div>
          {isOwner && (
            <Link
              href="/profile/edit"
              className="bg-transparent border border-[#263042] hover:bg-[#1e2433] hover:border-[#334155] text-[#f1f5f9] font-medium py-2 px-4 rounded-[8px] transition-colors"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-[#263042]">
            <h3 className="text-sm font-medium text-[#f1f5f9] mb-2">About</h3>
            <p className="text-[#94a3b8] leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Links */}
        <div className="mt-6 flex space-x-4">
          {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-[#06b6d4] hover:underline text-sm">GitHub</a>}
          {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#06b6d4] hover:underline text-sm">LinkedIn</a>}
          {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-[#06b6d4] hover:underline text-sm">Portfolio</a>}
          {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="text-[#06b6d4] hover:underline text-sm">Website</a>}
        </div>
      </div>

      {/* Skills Card */}
      <div className="bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042]">
        <h2 className="text-xl font-bold text-white mb-6">Skills</h2>
        <div className="flex flex-wrap gap-3">
          {profile.user?.userSkills?.length > 0 ? (
            profile.user.userSkills.map((us: any) => (
              <div key={us.skillId} className="flex flex-col bg-[#141822] border border-[#263042] px-4 py-2 rounded-[8px]">
                <span className="text-[#f1f5f9] font-medium">{us.skill.name}</span>
                <span className="text-[#64748b] text-xs mt-1 capitalize">{us.proficiency}</span>
              </div>
            ))
          ) : (
            <p className="text-[#64748b]">No skills listed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
