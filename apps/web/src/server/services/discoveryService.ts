import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { DeveloperSearchInput, ProjectSearchInput, developerSearchSchema, projectSearchSchema } from '../../lib/validations/discovery';

function buildTsQuery(q: string) {
  // Convert basic search strings into valid tsquery by joining with &
  const terms = q.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return '';
  return terms.map(term => `${term}:*`).join(' & ');
}

export async function searchProjects(userId: string | null, input: ProjectSearchInput) {
  const parsed = projectSearchSchema.parse(input);
  const { q, cursor, limit, sort, skills, category, difficulty, availability, projectType } = parsed;

  const conditions: Prisma.Sql[] = [Prisma.sql`p.status = 'open'`]; // Hide drafts/paused
  
  // Hide projects of suspended users
  conditions.push(Prisma.sql`p."ownerId" NOT IN (SELECT id FROM "User" WHERE status = 'suspended')`);

  if (q) {
    const tsQuery = buildTsQuery(q);
    const textCondition = Prisma.sql`(
      (setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
       setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
       setweight(to_tsvector('english', coalesce(p."problemStatement", '')), 'C')) @@ to_tsquery('english', ${tsQuery})
      OR p.name % ${q}
    )`;
    conditions.push(textCondition);
  }

  if (category && category.length > 0) {
    conditions.push(Prisma.sql`p.category IN (${Prisma.join(category)})`);
  }
  
  if (difficulty && difficulty.length > 0) {
    conditions.push(Prisma.sql`p."experienceRequirement" IN (${Prisma.join(difficulty)})`);
  }

  if (availability && availability.length > 0) {
    conditions.push(Prisma.sql`p."weeklyCommitment" IN (${Prisma.join(availability)})`);
  }

  if (projectType && projectType.length > 0) {
    conditions.push(Prisma.sql`p."collaborationType" && ARRAY[${Prisma.join(projectType)}]::text[]`);
  }

  if (skills && skills.length > 0) {
    conditions.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM "ProjectSkill" ps 
        JOIN "Skill" s ON ps."skillId" = s.id 
        WHERE ps."projectId" = p.id AND s.name IN (${Prisma.join(skills)})
      )
    `);
  }

  let orderBy: Prisma.Sql;
  if (sort === 'relevance' && userId) {
    orderBy = Prisma.sql`m.score DESC NULLS LAST, p."createdAt" DESC`;
  } else if (sort === 'popularity') {
    // sorting by application velocity / team activity. Since we have teamSizeCurrent, we can use that, or just fallback to createdAt
    orderBy = Prisma.sql`p."teamSizeCurrent" DESC, p."createdAt" DESC`; 
  } else {
    orderBy = Prisma.sql`p."createdAt" DESC`;
  }

  if (cursor) {
    // Decoding cursor logic
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
      if (sort === 'recency' || (sort === 'relevance' && !userId)) {
        conditions.push(Prisma.sql`(p."createdAt", p.id) < (${new Date(decoded.createdAt)}, ${decoded.id})`);
      } else if (sort === 'relevance' && userId) {
        conditions.push(Prisma.sql`(COALESCE(m.score, 0), p."createdAt", p.id) < (${decoded.score || 0}, ${new Date(decoded.createdAt)}, ${decoded.id})`);
      } else if (sort === 'popularity') {
        conditions.push(Prisma.sql`(p."teamSizeCurrent", p."createdAt", p.id) < (${decoded.popularity || 0}, ${new Date(decoded.createdAt)}, ${decoded.id})`);
      }
    } catch (e) {
      // Ignore invalid cursor
    }
  }

  const whereClause = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
  
  const query = Prisma.sql`
    SELECT 
      p.*,
      m.score as "matchScore",
      m.explanation as "matchExplanation",
      u.username as "ownerUsername"
    FROM "Project" p
    JOIN "User" u ON p."ownerId" = u.id
    LEFT JOIN "Match" m ON m."projectId" = p.id AND m."userId" = ${userId ?? ''}
    ${whereClause}
    ORDER BY ${orderBy}, p.id DESC
    LIMIT ${limit + 1}
  `;

  const results = await prisma.$queryRaw<any[]>(query);

  let nextCursor: string | undefined = undefined;
  if (results.length > limit) {
    const nextItem = results.pop();
    const cursorObj: any = {
      id: nextItem.id,
      createdAt: nextItem.createdAt,
    };
    if (sort === 'relevance' && userId) cursorObj.score = nextItem.matchScore;
    if (sort === 'popularity') cursorObj.popularity = nextItem.teamSizeCurrent;
    
    nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
  }

  return {
    items: results,
    nextCursor
  };
}

export async function searchDevelopers(currentUserId: string | null, input: DeveloperSearchInput) {
  const parsed = developerSearchSchema.parse(input);
  const { q, projectId, cursor, limit, sort, experience, location, availability, projectInterests, skills } = parsed;

  const conditions: Prisma.Sql[] = [
    Prisma.sql`u.status != 'suspended'`,
    Prisma.sql`p."profileVisibility" = 'public'`
  ];

  if (q) {
    const tsQuery = buildTsQuery(q);
    const textCondition = Prisma.sql`(
      (setweight(to_tsvector('english', coalesce(p."displayName", '')), 'A') ||
       setweight(to_tsvector('english', coalesce(p.username, '')), 'B') ||
       setweight(to_tsvector('english', coalesce(p.bio, '')), 'C')) @@ to_tsquery('english', ${tsQuery})
      OR p."displayName" % ${q}
      OR p.username % ${q}
    )`;
    conditions.push(textCondition);
  }

  if (experience && experience.length > 0) {
    conditions.push(Prisma.sql`p."experienceLevel" IN (${Prisma.join(experience)})`);
  }

  if (location) {
    conditions.push(Prisma.sql`p.location ILIKE ${'%' + location + '%'}`);
  }

  if (availability && availability.length > 0) {
    conditions.push(Prisma.sql`p.availability IN (${Prisma.join(availability)})`);
  }

  if (projectInterests && projectInterests.length > 0) {
    conditions.push(Prisma.sql`p."preferredCollaboration" && ARRAY[${Prisma.join(projectInterests)}]::text[]`);
  }

  if (skills && skills.length > 0) {
    conditions.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM "UserSkill" us 
        JOIN "Skill" s ON us."skillId" = s.id 
        WHERE us."ownerId" = u.id AND s.name IN (${Prisma.join(skills)})
      )
    `);
  }

  let orderBy: Prisma.Sql;
  if (sort === 'relevance' && currentUserId && projectId) {
    orderBy = Prisma.sql`m.score DESC NULLS LAST, u."createdAt" DESC`; 
  } else {
    orderBy = Prisma.sql`u."createdAt" DESC`;
  }

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
      if (sort === 'relevance' && currentUserId && projectId) {
        conditions.push(Prisma.sql`(COALESCE(m.score, 0), u."createdAt", u.id) < (${decoded.score || 0}, ${new Date(decoded.createdAt)}, ${decoded.id})`);
      } else {
        conditions.push(Prisma.sql`(u."createdAt", u.id) < (${new Date(decoded.createdAt)}, ${decoded.id})`);
      }
    } catch (e) {}
  }

  const whereClause = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

  let query: Prisma.Sql;
  if (sort === 'relevance' && currentUserId && projectId) {
    query = Prisma.sql`
      SELECT 
        p.*,
        u.id as "userId",
        u."createdAt",
        m.score as "matchScore",
        m.explanation as "matchExplanation"
      FROM "Profile" p
      JOIN "User" u ON p."userId" = u.id
      LEFT JOIN "Match" m ON m."userId" = u.id AND m."projectId" = ${projectId}
      ${whereClause}
      ORDER BY ${orderBy}, u.id DESC
      LIMIT ${limit + 1}
    `;
  } else {
    query = Prisma.sql`
      SELECT 
        p.*,
        u.id as "userId",
        u."createdAt"
      FROM "Profile" p
      JOIN "User" u ON p."userId" = u.id
      ${whereClause}
      ORDER BY ${orderBy}, u.id DESC
      LIMIT ${limit + 1}
    `;
  }

  const results = await prisma.$queryRaw<any[]>(query);

  let nextCursor: string | undefined = undefined;
  if (results.length > limit) {
    const nextItem = results.pop();
    const cursorObj: any = {
      id: nextItem.userId,
      createdAt: nextItem.createdAt,
    };
    if (sort === 'relevance' && currentUserId && projectId) {
      cursorObj.score = nextItem.matchScore;
    }
    nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
  }

  return {
    items: results,
    nextCursor
  };
}
