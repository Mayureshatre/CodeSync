import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TEST_DEVELOPERS,
  TEST_PROJECTS,
  checkDatabaseSafety,
  isDirectExecution,
} from '../../prisma/seed-discovery';
import { computeMatchScore } from '@codesync/core/matchingService';

describe('Seed Discovery Dataset - Integrity & Schema Compliance', () => {
  it('contains between 8 and 10 fictional developers', () => {
    expect(TEST_DEVELOPERS.length).toBeGreaterThanOrEqual(8);
    expect(TEST_DEVELOPERS.length).toBeLessThanOrEqual(10);
  });

  it('contains between 10 and 15 fictional projects', () => {
    expect(TEST_PROJECTS.length).toBeGreaterThanOrEqual(10);
    expect(TEST_PROJECTS.length).toBeLessThanOrEqual(15);
  });

  it('ensures all developer emails use example.com domain and are unique', () => {
    const emails = TEST_DEVELOPERS.map((d) => d.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);

    for (const email of emails) {
      expect(email.endsWith('@example.com')).toBe(true);
      expect(email).toMatch(/^[a-z0-9.]+@example\.com$/);
    }
  });

  it('ensures all usernames are unique and conform to username regex', () => {
    const usernames = TEST_DEVELOPERS.map((d) => d.username);
    const uniqueUsernames = new Set(usernames);
    expect(uniqueUsernames.size).toBe(usernames.length);

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    for (const username of usernames) {
      expect(username).toMatch(usernameRegex);
      expect(username.length).toBeGreaterThanOrEqual(3);
      expect(username.length).toBeLessThanOrEqual(30);
    }
  });

  it('ensures all project slugs start with test- and are unique', () => {
    const slugs = TEST_PROJECTS.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);

    for (const slug of slugs) {
      expect(slug.startsWith('test-')).toBe(true);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('ensures every project ownerEmail references a seeded test developer', () => {
    const developerEmails = new Set(TEST_DEVELOPERS.map((d) => d.email));
    for (const project of TEST_PROJECTS) {
      expect(developerEmails.has(project.ownerEmail)).toBe(true);
    }
  });

  it('includes deliberate negative test cases for draft and moderated projects', () => {
    const draftProjects = TEST_PROJECTS.filter((p) => p.status === 'draft');
    expect(draftProjects.length).toBeGreaterThanOrEqual(1);

    const moderatedProjects = TEST_PROJECTS.filter((p) => p.moderationHidden === true);
    expect(moderatedProjects.length).toBeGreaterThanOrEqual(1);
  });

  it('includes deliberate test cases for not_looking availability and unlisted visibility', () => {
    const notLookingDevs = TEST_DEVELOPERS.filter((d) => d.availability === 'not_looking');
    expect(notLookingDevs.length).toBeGreaterThanOrEqual(1);

    const unlistedDevs = TEST_DEVELOPERS.filter((d) => d.profileVisibility === 'unlisted');
    expect(unlistedDevs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Seed Discovery Dataset - Safety Mechanism', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('refuses when no database URL is defined', () => {
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    delete process.env.STAGING_DATABASE_URL;
    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('No database URL found');
  });

  it('refuses if environment is explicitly production', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@staging-db.supabase.co:5432/codesync_staging';
    process.env.CODESYNC_ENV = 'production';
    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('prohibited in production');
  });

  it('refuses if database name indicates production', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@staging-db.supabase.co:5432/codesync_production';
    process.env.CODESYNC_ENV = 'staging';
    process.env.ALLOW_STAGING_SEED = 'true';
    process.env.CONFIRM_STAGING_TARGET = 'codesync_production';
    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('appears to be a production database');
  });

  it('refuses remote database without CODESYNC_ENV=staging', () => {
    process.env.DATABASE_URL = 'postgresql://postgres:secret@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
    delete process.env.CODESYNC_ENV;

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('Remote database detected');
    expect(result.reason).toContain('CODESYNC_ENV=staging');
  });

  it('refuses staging database without ALLOW_STAGING_SEED=true', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@staging-db.supabase.co:5432/codesync_staging';
    process.env.CODESYNC_ENV = 'staging';
    delete process.env.ALLOW_STAGING_SEED;

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('ALLOW_STAGING_SEED=true');
  });

  it('refuses staging database without CONFIRM_STAGING_TARGET', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@staging-db.supabase.co:5432/codesync_staging';
    process.env.CODESYNC_ENV = 'staging';
    process.env.ALLOW_STAGING_SEED = 'true';
    delete process.env.CONFIRM_STAGING_TARGET;

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('CONFIRM_STAGING_TARGET');
  });

  it('refuses staging database if CONFIRM_STAGING_TARGET is "production" or "prod"', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@staging-db.supabase.co:5432/codesync_staging';
    process.env.CODESYNC_ENV = 'staging';
    process.env.ALLOW_STAGING_SEED = 'true';
    process.env.CONFIRM_STAGING_TARGET = 'production';

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('cannot be "prod" or "production"');
  });

  it('refuses staging database if CONFIRM_STAGING_TARGET does not match database or host', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@staging-db.supabase.co:5432/codesync_staging';
    process.env.CODESYNC_ENV = 'staging';
    process.env.ALLOW_STAGING_SEED = 'true';
    process.env.CONFIRM_STAGING_TARGET = 'some_other_db';

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('does not match the configured database target');
  });

  it('approves staging database when CODESYNC_ENV=staging, ALLOW_STAGING_SEED=true, and CONFIRM_STAGING_TARGET matches', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@staging-db.supabase.co:5432/codesync_staging';
    process.env.CODESYNC_ENV = 'staging';
    process.env.ALLOW_STAGING_SEED = 'true';
    process.env.CONFIRM_STAGING_TARGET = 'codesync_staging';

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(true);
    expect(result.targetEnv).toBe('staging');
    expect(result.database).toBe('codesync_staging');
  });

  it('approves staging database using STAGING_DATABASE_URL and matching host fragment', () => {
    process.env.STAGING_DATABASE_URL = 'postgresql://user:pass@aws-staging-cluster.pooler.supabase.com:6543/postgres';
    process.env.CODESYNC_ENV = 'staging';
    process.env.ALLOW_STAGING_SEED = 'true';
    process.env.CONFIRM_STAGING_TARGET = 'aws-staging-cluster';

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(true);
    expect(result.targetEnv).toBe('staging');
  });

  it('refuses localhost without confirmation flag or ALLOW_DEV_SEED', () => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/codesync_dev';
    delete process.env.ALLOW_DEV_SEED;
    delete process.env.CODESYNC_ENV;

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(false);
    expect(result.reason).toContain('requires explicit confirmation');
  });

  it('allows localhost with ALLOW_DEV_SEED=true', () => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/codesync_dev';
    process.env.ALLOW_DEV_SEED = 'true';

    const result = checkDatabaseSafety();
    expect(result.isSafe).toBe(true);
    expect(result.targetEnv).toBe('local');
  });

  it('never outputs raw credentials or passwords in masked host', () => {
    process.env.DATABASE_URL = 'postgresql://admin_user:super_secret_pw@db.ldvheeymkvdrnvqejpmg.supabase.co:5432/postgres';
    const result = checkDatabaseSafety();
    expect(result.host).not.toContain('super_secret_pw');
    expect(result.host).not.toContain('admin_user');
    expect(result.host).toContain('***');
  });
});

describe('Seed Discovery Dataset - Matching Engine Verifications', () => {
  it('computes a high match score (>80%) for Elena on AuroraPulse', () => {
    const elena = TEST_DEVELOPERS.find((d) => d.email === 'elena.rostova@example.com')!;
    const auroraPulse = TEST_PROJECTS.find((p) => p.slug === 'test-aurorapulse-observability')!;

    // Build format expected by computeMatchScore pure function
    const user = {
      profile: {
        availability: elena.availability,
        experienceLevel: elena.experienceLevel,
        preferredCollaboration: elena.preferredCollaboration,
      },
      userSkills: elena.skills.map((s, idx) => ({
        skillId: `s-${s.name.toLowerCase()}`,
        proficiency: s.proficiency,
        skill: { name: s.name },
      })),
    };

    const project = {
      status: auroraPulse.status,
      experienceRequirement: auroraPulse.experienceRequirement,
      collaborationType: auroraPulse.collaborationType,
      tags: auroraPulse.tags,
      projectSkills: auroraPulse.skills.map((s) => ({
        skillId: `s-${s.name.toLowerCase()}`,
        requirementType: s.requirementType,
        minProficiency: s.minProficiency,
      })),
    };

    const result = computeMatchScore(user, project);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(80);
    expect(result!.factorBreakdown.skills).toBe(100);
    expect(result!.factorBreakdown.experience).toBe(100);
  });

  it('fails hard filter when developer is missing a required skill (Chloe on KubeFlow)', () => {
    const chloe = TEST_DEVELOPERS.find((d) => d.email === 'chloe.dubois@example.com')!;
    const kubeFlow = TEST_PROJECTS.find((p) => p.slug === 'test-kubeflow-cluster-autoscaler')!;

    const user = {
      profile: {
        availability: chloe.availability,
        experienceLevel: chloe.experienceLevel,
        preferredCollaboration: chloe.preferredCollaboration,
      },
      userSkills: chloe.skills.map((s) => ({
        skillId: `s-${s.name.toLowerCase()}`,
        proficiency: s.proficiency,
        skill: { name: s.name },
      })),
    };

    const project = {
      status: kubeFlow.status,
      experienceRequirement: kubeFlow.experienceRequirement,
      collaborationType: kubeFlow.collaborationType,
      tags: kubeFlow.tags,
      projectSkills: kubeFlow.skills.map((s) => ({
        skillId: `s-${s.name.toLowerCase()}`,
        requirementType: s.requirementType,
        minProficiency: s.minProficiency,
      })),
    };

    const result = computeMatchScore(user, project);
    expect(result).toBeNull(); // Missing Go (required at expert level)
  });

  it('fails hard filter when developer availability is not_looking (David on any project)', () => {
    const david = TEST_DEVELOPERS.find((d) => d.email === 'david.miller@example.com')!;
    const auroraPulse = TEST_PROJECTS.find((p) => p.slug === 'test-aurorapulse-observability')!;

    const user = {
      profile: {
        availability: david.availability,
        experienceLevel: david.experienceLevel,
        preferredCollaboration: david.preferredCollaboration,
      },
      userSkills: david.skills.map((s) => ({
        skillId: `s-${s.name.toLowerCase()}`,
        proficiency: s.proficiency,
        skill: { name: s.name },
      })),
    };

    const project = {
      status: auroraPulse.status,
      experienceRequirement: auroraPulse.experienceRequirement,
      collaborationType: auroraPulse.collaborationType,
      tags: auroraPulse.tags,
      projectSkills: auroraPulse.skills.map((s) => ({
        skillId: `s-${s.name.toLowerCase()}`,
        requirementType: s.requirementType,
        minProficiency: s.minProficiency,
      })),
    };

    const result = computeMatchScore(user, project);
    expect(result).toBeNull();
  });
});

describe('Seed Discovery Dataset - Module Entrypoint Compatibility', () => {
  const origArgv = [...process.argv];

  afterEach(() => {
    process.argv = [...origArgv];
  });

  it('detects direct CLI execution when argv[1] points to seed-discovery.ts', () => {
    process.argv[1] = 'C:\\Practice coding\\CodeSync - Platform\\prisma\\seed-discovery.ts';
    expect(isDirectExecution()).toBe(true);
  });

  it('detects direct CLI execution when argv[1] points to compiled seed-discovery.js', () => {
    process.argv[1] = '/workspace/prisma/seed-discovery.js';
    expect(isDirectExecution()).toBe(true);
  });

  it('detects direct CLI execution when argv[1] is extensionless seed-discovery', () => {
    process.argv[1] = '/app/prisma/seed-discovery';
    expect(isDirectExecution()).toBe(true);
  });

  it('returns false when imported by a test runner (e.g. vitest)', () => {
    process.argv[1] = 'C:\\Practice coding\\CodeSync - Platform\\node_modules\\vitest\\vitest.mjs';
    expect(isDirectExecution()).toBe(false);
  });
});
