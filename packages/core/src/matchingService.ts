import { prisma } from './db';
import { getMatchSurfacingThreshold } from './configService';
import { calculateProfileCompleteness } from './profileUtils';
import { createNotification } from './notificationService';
import { enqueueNotification } from './queue';

export const MATCHING_ALGORITHM_VERSION = 1;

export interface MatchFactorBreakdown {
  skills: number;
  experience: number;
  collaboration: number;
  availability: number;
  techInterest: number;
  completeness: number;
}

export interface MatchResult {
  score: number;
  factorBreakdown: MatchFactorBreakdown;
  algorithmVersion: number;
  explanation: string;
}

// Convert proficiency strings to numeric values for comparison
function getProficiencyScore(proficiency: string): number {
  switch (proficiency.toLowerCase()) {
    case 'beginner': return 1;
    case 'intermediate': return 2;
    case 'advanced': return 3;
    case 'expert': return 4;
    default: return 0;
  }
}

/**
 * Pure, deterministic function to compute match score.
 * Returns null if hard filters fail.
 */
export function computeMatchScore(user: any, project: any): MatchResult | null {
  // HARD FILTERS
  if (user.profile.availability === 'not_looking') {
    return null; // Hard filter: not looking
  }

  const userSkillMap = new Map<string, number>();
  for (const us of user.userSkills || []) {
    userSkillMap.set(us.skillId, getProficiencyScore(us.proficiency));
  }

  const requiredSkills = project.projectSkills?.filter((ps: any) => ps.requirementType === 'required') || [];
  
  for (const reqSkill of requiredSkills) {
    const userProf = userSkillMap.get(reqSkill.skillId);
    if (userProf === undefined) {
      return null; // Missing required skill
    }
    if (userProf < getProficiencyScore(reqSkill.minProficiency)) {
      return null; // Below minimum proficiency
    }
  }

  // WEIGHTED SCORING
  
  // 1. Skills (40%)
  const allProjectSkills = project.projectSkills || [];
  let skillScore = 100;
  if (allProjectSkills.length > 0) {
    let totalRatio = 0;
    for (const ps of allProjectSkills) {
      const userProf = userSkillMap.get(ps.skillId) || 0;
      const reqProf = getProficiencyScore(ps.minProficiency) || 1;
      const ratio = Math.min(userProf / reqProf, 1);
      totalRatio += ratio;
    }
    skillScore = (totalRatio / allProjectSkills.length) * 100;
  }

  // 2. Experience (15%)
  let expScore = 100;
  if (project.experienceRequirement) {
    const reqScore = getProficiencyScore(project.experienceRequirement);
    const userScore = getProficiencyScore(user.profile.experienceLevel);
    if (userScore >= reqScore) expScore = 100;
    else if (userScore === reqScore - 1) expScore = 50;
    else expScore = 25;
  }

  // 3. Collaboration / Project Type (15%)
  let collabScore = 100;
  const projCollab = project.collaborationType || [];
  const userCollab = user.profile.preferredCollaboration || [];
  if (projCollab.length > 0 && userCollab.length > 0) {
    const intersection = projCollab.filter((c: string) => userCollab.includes(c));
    collabScore = (intersection.length / projCollab.length) * 100;
  } else if (projCollab.length > 0 && userCollab.length === 0) {
    collabScore = 0;
  }

  // 4. Availability (10%)
  let availScore = 100;
  if (user.profile.availability === 'available') availScore = 100;
  else if (user.profile.availability === 'open_to_projects') availScore = 80;
  else if (user.profile.availability === 'busy') availScore = 30;

  // 5. Tech / Domain Interest (10%)
  let techScore = 100;
  const projTags = project.tags || [];
  if (projTags.length > 0) {
    const userSkillNames = (user.userSkills || []).map((us: any) => us.skill.name.toLowerCase());
    const matchedTags = projTags.filter((tag: string) => 
      userSkillNames.some((sn: string) => sn.includes(tag.toLowerCase()) || tag.toLowerCase().includes(sn))
    );
    techScore = (matchedTags.length / projTags.length) * 100;
  }

  // 6. Profile Completeness (10%)
  const completenessScore = calculateProfileCompleteness(user.profile, user.userSkills || []);

  const factorBreakdown: MatchFactorBreakdown = {
    skills: Math.round(skillScore),
    experience: Math.round(expScore),
    collaboration: Math.round(collabScore),
    availability: Math.round(availScore),
    techInterest: Math.round(techScore),
    completeness: Math.round(completenessScore)
  };

  const finalScore = 
    (factorBreakdown.skills * 0.40) +
    (factorBreakdown.experience * 0.15) +
    (factorBreakdown.collaboration * 0.15) +
    (factorBreakdown.availability * 0.10) +
    (factorBreakdown.techInterest * 0.10) +
    (factorBreakdown.completeness * 0.10);

  // Deterministic explanation template
  const explanation = generateExplanation(factorBreakdown, finalScore);

  return {
    score: parseFloat(finalScore.toFixed(2)),
    factorBreakdown,
    algorithmVersion: MATCHING_ALGORITHM_VERSION,
    explanation
  };
}

function generateExplanation(breakdown: MatchFactorBreakdown, score: number): string {
  const parts = [];
  if (breakdown.skills >= 80) parts.push('Excellent skill alignment');
  else if (breakdown.skills >= 50) parts.push('Moderate skill alignment');
  else parts.push('Lacking some preferred skills');

  if (breakdown.experience >= 100) parts.push('meets experience requirements');
  else parts.push('slightly below preferred experience level');

  if (breakdown.collaboration >= 100) parts.push('perfect collaboration match');

  return `Overall ${Math.round(score)}% match: ${parts.join(', ')}.`;
}

/**
 * Recalculates match score for a specific user and project pair and persists to DB.
 */
export async function recomputeAndPersistMatch(userId: string, projectId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userSkills: { include: { skill: true } }
    }
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectSkills: { include: { skill: true } }
    }
  });

  if (!user || !user.profile || !project || project.status !== 'open') {
    // If conditions fail, remove existing match
    await prisma.match.deleteMany({ where: { userId, projectId } });
    return null;
  }

  const result = computeMatchScore(user, project);

  if (!result) {
    // Hard filter failed, remove existing match
    await prisma.match.deleteMany({ where: { userId, projectId } });
    return null;
  }

  // Persist the match
  const match = await prisma.match.upsert({
    where: { userId_projectId: { userId, projectId } },
    update: {
      score: result.score,
      factorBreakdown: result.factorBreakdown as any,
      algorithmVersion: result.algorithmVersion,
      computedAt: new Date()
    },
    create: {
      userId,
      projectId,
      score: result.score,
      factorBreakdown: result.factorBreakdown as any,
      algorithmVersion: result.algorithmVersion,
      computedAt: new Date()
    }
  });

  // Evaluate for recommendation surfacing
  const threshold = await getMatchSurfacingThreshold();
  if (match.score >= threshold) {
    // Create recommendation for the user to see the project
    const existingRec = await prisma.recommendation.findFirst({
      where: { userId, targetType: 'project', targetId: projectId }
    });
    if (!existingRec) {
      const newRec = await prisma.recommendation.create({
        data: { userId, targetType: 'project', targetId: projectId }
      });

      // M8-D-B: Trigger notification for newly created recommendation
      try {
        const notification = await createNotification(userId, 'PROJECT_MATCH', {
          event: 'project_match_created',
          projectId,
          matchId: match.id,
          recommendationId: newRec.id,
          score: match.score
        });

        await enqueueNotification({
          notificationId: notification.id,
          userId,
          category: 'PROJECT_MATCH',
          payload: notification.payload
        });
      } catch (notifError) {
        console.error('Failed to dispatch project_match_created notification', notifError);
      }
    }
  }

  return match;
}
