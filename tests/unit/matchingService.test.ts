import { describe, it, expect } from 'vitest';
import { computeMatchScore, MATCHING_ALGORITHM_VERSION } from '../../apps/web/src/server/services/matchingService';

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
