const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Admin User
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      authProvider: 'credentials',
      role: 'admin',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          username: 'admin',
          displayName: 'Admin User',
          bio: 'System Administrator',
          experienceLevel: 'expert',
        }
      }
    }
  });

  // E2E User 1
  const u1 = await prisma.user.upsert({
    where: { email: 'e2e1@example.com' },
    update: {},
    create: {
      email: 'e2e1@example.com',
      passwordHash,
      authProvider: 'credentials',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          username: 'e2e1',
          displayName: 'E2E Developer 1',
          bio: 'Test developer',
          experienceLevel: 'intermediate',
        }
      }
    }
  });

  // E2E User 2
  const u2 = await prisma.user.upsert({
    where: { email: 'e2e2@example.com' },
    update: {},
    create: {
      email: 'e2e2@example.com',
      passwordHash,
      authProvider: 'credentials',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          username: 'e2e2',
          displayName: 'E2E Developer 2',
          bio: 'Test developer 2',
          experienceLevel: 'intermediate',
        }
      }
    }
  });

  // E2E User 3
  const u3 = await prisma.user.upsert({
    where: { email: 'e2e3@example.com' },
    update: {},
    create: {
      email: 'e2e3@example.com',
      passwordHash,
      authProvider: 'credentials',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          username: 'e2e3',
          displayName: 'E2E Developer 3',
          bio: 'Test developer 3',
          experienceLevel: 'intermediate',
        }
      }
    }
  });

  // Seed a basic skill
  const skill = await prisma.skill.upsert({
    where: { name: 'React' },
    update: {},
    create: { name: 'React', category: 'Frontend' }
  });

  console.log('E2E database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
