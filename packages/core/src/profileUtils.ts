export function calculateProfileCompleteness(profile: any, userSkills: any[]): number {
  let score = 0;
  if (!profile) return score;

  if (profile.displayName) score += 10;
  if (profile.bio) score += 10;
  if (profile.location) score += 10;
  if (profile.experienceLevel) score += 10;

  if (userSkills && userSkills.length > 0) score += 20;
  if (userSkills && userSkills.length >= 3) score += 20;

  if (profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.websiteUrl) score += 20;

  return score;
}
