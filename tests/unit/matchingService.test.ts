import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeMatchScore, recomputeAndPersistMatch, MATCHING_ALGORITHM_VERSION } from '@codesync/core/matchingService';
import { prisma } from '@codesync/core/db';
import { getMatchSurfacingThreshold } from '@codesync/core/configService';
import { createNotification } from '@codesync/core/notificationService';
import { enqueueNotification } from '@codesync/core/queue';

vi.mock('@codesync/core/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { findUnique: vi.fn() },
    match: { deleteMany: vi.fn(), upsert: vi.fn() },
    recommendation: { findFirst: vi.fn(), create: vi.fn() }
  }
}));

vi.mock('@codesync/core/configService', () => ({
  getMatchSurfacingThreshold: vi.fn()
}));

vi.mock('@codesync/core/notificationService', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'notif-1', payload: {} })
}));

vi.mock('@codesync/core/queue', () => ({
  enqueueNotification: vi.fn().mockResolvedValue(undefined)
}));

describe('matchingService - computeMatchScore', () => {
  const baseUser = {
    profile: {
      availability: 'available',
      experienceLevel: 'intermediate',
      preferredCollaboration: ['open_source', 'startup'],
    },
    userSkills: [
      { skillId: 's1', proficiency: 'intermediate', skill: { name: 'Python' } },
      { skillId: 's2', proficiency: 'advanced', skill: { name: 'React' } },
    ]
  };

  const baseProject = {
    status: 'open',
    experienceRequirement: 'intermediate',
    collaborationType: ['open_source'],
    tags: ['python', 'frontend'],
    projectSkills: [
      { skillId: 's1', requirementType: 'required', minProficiency: 'beginner' },
      { skillId: 's2', requirementType: 'preferred', minProficiency: 'intermediate' }
    ]
  };

  it('fails hard filter if user is not_looking', () => {
    const user = { ...baseUser, profile: { ...baseUser.profile, availability: 'not_looking' } };
    const result = computeMatchScore(user, baseProject);
    expect(result).toBeNull();
  });

  it('fails hard filter if missing required skill', () => {
    const project = {
      ...baseProject,
      projectSkills: [
        { skillId: 's3', requirementType: 'required', minProficiency: 'beginner' } // user doesn't have s3
      ]
    };
    const result = computeMatchScore(baseUser, project);
    expect(result).toBeNull();
  });

  it('fails hard filter if below minimum proficiency', () => {
    const project = {
      ...baseProject,
      projectSkills: [
        { skillId: 's1', requirementType: 'required', minProficiency: 'advanced' } // user has intermediate (2) vs req (3)
      ]
    };
    const result = computeMatchScore(baseUser, project);
    expect(result).toBeNull();
  });

  it('passes hard filter if exact minimum proficiency', () => {
    const project = {
      ...baseProject,
      projectSkills: [
        { skillId: 's1', requirementType: 'required', minProficiency: 'intermediate' } // user has intermediate
      ]
    };
    const result = computeMatchScore(baseUser, project);
    expect(result).not.toBeNull();
  });

  it('computes weighted scores correctly', () => {
    const result = computeMatchScore(baseUser, baseProject);
    expect(result).not.toBeNull();
    
    // Skills:
    // s1: intermediate (2) / req beginner (1) -> capped at 1
    // s2: advanced (3) / req intermediate (2) -> capped at 1
    // Skill score: (1 + 1) / 2 = 1.0 -> 100%
    expect(result?.factorBreakdown.skills).toBe(100);

    // Experience: user intermediate (2) >= req intermediate (2) -> 100%
    expect(result?.factorBreakdown.experience).toBe(100);

    // Collaboration: project 'open_source', user 'open_source', 'startup'
    // Intersection size 1 / proj length 1 -> 100%
    expect(result?.factorBreakdown.collaboration).toBe(100);

    // Availability: available -> 100%
    expect(result?.factorBreakdown.availability).toBe(100);

    // Tech: tags python, frontend. user skills: Python, React.
    // python matches Python. frontend doesn't directly text-match React.
    // Intersection 1 (python) / proj length 2 -> 50%
    expect(result?.factorBreakdown.techInterest).toBe(50);

    expect(result?.algorithmVersion).toBe(MATCHING_ALGORITHM_VERSION);
    expect(result?.explanation).toContain('Overall');
  });
});

describe('matchingService - recomputeAndPersistMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseUser = {
    id: 'u1',
    profile: {
      availability: 'available',
      experienceLevel: 'intermediate',
      preferredCollaboration: ['open_source'],
    },
    userSkills: [
      { skillId: 's1', proficiency: 'intermediate', skill: { name: 'Python' } }
    ]
  };

  const baseProject = {
    id: 'p1',
    status: 'open',
    projectSkills: [
      { skillId: 's1', requirementType: 'required', minProficiency: 'beginner' }
    ]
  };

  it('triggers a notification when a new qualifying match is created', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(baseUser as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as any);
    vi.mocked(getMatchSurfacingThreshold).mockResolvedValue(50);
    vi.mocked(prisma.recommendation.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.recommendation.create).mockResolvedValue({ id: 'rec-1' } as any);
    vi.mocked(prisma.match.upsert).mockResolvedValue({ id: 'match-1', score: 100 } as any);
    vi.mocked(createNotification).mockResolvedValue({ id: 'notif-1', payload: {} } as any);

    await recomputeAndPersistMatch('u1', 'p1');

    expect(prisma.recommendation.create).toHaveBeenCalledWith({
      data: { userId: 'u1', targetType: 'project', targetId: 'p1' }
    });

    expect(createNotification).toHaveBeenCalledWith('u1', 'PROJECT_MATCH', expect.objectContaining({
      event: 'project_match_created',
      projectId: 'p1',
      matchId: 'match-1',
      recommendationId: 'rec-1',
      score: 100
    }));

    expect(enqueueNotification).toHaveBeenCalledWith({
      notificationId: 'notif-1',
      userId: 'u1',
      category: 'PROJECT_MATCH',
      payload: {}
    });
  });

  it('does not duplicate notification if recommendation already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(baseUser as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as any);
    vi.mocked(getMatchSurfacingThreshold).mockResolvedValue(50);
    vi.mocked(prisma.recommendation.findFirst).mockResolvedValue({ id: 'existing-rec' } as any);
    vi.mocked(prisma.match.upsert).mockResolvedValue({ id: 'match-1', score: 100 } as any);

    await recomputeAndPersistMatch('u1', 'p1');

    expect(prisma.recommendation.create).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
    expect(enqueueNotification).not.toHaveBeenCalled();
  });

  it('does not trigger notification if match does not meet threshold', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(baseUser as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as any);
    vi.mocked(getMatchSurfacingThreshold).mockResolvedValue(100);
    vi.mocked(prisma.match.upsert).mockResolvedValue({ id: 'match-1', score: 20 } as any);

    await recomputeAndPersistMatch('u1', 'p1');

    expect(prisma.recommendation.findFirst).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('does not break match creation if notification fails', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(baseUser as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as any);
    vi.mocked(getMatchSurfacingThreshold).mockResolvedValue(50);
    vi.mocked(prisma.recommendation.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.recommendation.create).mockResolvedValue({ id: 'rec-1' } as any);
    vi.mocked(prisma.match.upsert).mockResolvedValue({ id: 'match-1', score: 100 } as any);
    
    vi.mocked(createNotification).mockRejectedValueOnce(new Error('DB error'));

    const result = await recomputeAndPersistMatch('u1', 'p1');
    
    expect(result).toBeDefined();
    expect(result?.id).toBe('match-1');
  });

  it('does not trigger notification if hard filters fail', async () => {
    const user = { ...baseUser, profile: { ...baseUser.profile, availability: 'not_looking' } };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as any);

    await recomputeAndPersistMatch('u1', 'p1');

    expect(prisma.match.upsert).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });
});
