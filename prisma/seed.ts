import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PlatformConfig...');
  const configs = [
    { key: 'matchSurfacingThreshold', value: '75' },
    { key: 'reviewVisibilityWindowDays', value: '14' },
    { key: 'accountDeletionGraceDays', value: '30' },
  ];

  for (const config of configs) {
    await prisma.platformConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: {
        key: config.key,
        value: config.value,
      },
    });
  }

  console.log('Seeding Skill taxonomy...');
  const standardSkills = [
    // Frontend
    { name: 'JavaScript', category: 'Frontend', aliases: ['JS', 'ES6', 'ECMAScript'] },
    { name: 'TypeScript', category: 'Frontend', aliases: ['TS'] },
    { name: 'React', category: 'Frontend', aliases: ['React.js', 'ReactJS'] },
    { name: 'Next.js', category: 'Frontend', aliases: ['NextJS', 'Next'] },
    { name: 'Vue.js', category: 'Frontend', aliases: ['Vue', 'VueJS'] },
    { name: 'Angular', category: 'Frontend', aliases: ['AngularJS', 'Angular 2+'] },
    { name: 'Svelte', category: 'Frontend', aliases: ['SvelteKit'] },
    { name: 'Tailwind CSS', category: 'Frontend', aliases: ['Tailwind', 'TailwindCSS'] },
    { name: 'HTML/CSS', category: 'Frontend', aliases: ['HTML', 'CSS', 'HTML5', 'CSS3'] },

    // Backend
    { name: 'Node.js', category: 'Backend', aliases: ['Node', 'NodeJS'] },
    { name: 'Python', category: 'Backend', aliases: ['Py'] },
    { name: 'FastAPI', category: 'Backend', aliases: ['Fast API'] },
    { name: 'Django', category: 'Backend', aliases: ['Django REST'] },
    { name: 'Go', category: 'Backend', aliases: ['Golang'] },
    { name: 'Rust', category: 'Backend', aliases: ['Rustlang'] },
    { name: 'Java', category: 'Backend', aliases: [] },
    { name: 'Spring Boot', category: 'Backend', aliases: ['Spring'] },
    { name: 'C#', category: 'Backend', aliases: ['CSharp', '.NET', 'dotnet'] },
    { name: 'Ruby on Rails', category: 'Backend', aliases: ['Rails', 'Ruby'] },
    { name: 'PHP', category: 'Backend', aliases: ['Laravel'] },

    // Database
    { name: 'PostgreSQL', category: 'Database', aliases: ['Postgres', 'PG'] },
    { name: 'MySQL', category: 'Database', aliases: ['MariaDB'] },
    { name: 'MongoDB', category: 'Database', aliases: ['Mongo'] },
    { name: 'Redis', category: 'Database', aliases: [] },
    { name: 'SQLite', category: 'Database', aliases: [] },
    { name: 'Prisma', category: 'Database', aliases: ['Prisma ORM'] },
    { name: 'Supabase', category: 'Database', aliases: [] },

    // Cloud & DevOps
    { name: 'Docker', category: 'DevOps', aliases: ['Containers'] },
    { name: 'Kubernetes', category: 'DevOps', aliases: ['K8s'] },
    { name: 'AWS', category: 'DevOps', aliases: ['Amazon Web Services'] },
    { name: 'Google Cloud', category: 'DevOps', aliases: ['GCP', 'Google Cloud Platform'] },
    { name: 'Azure', category: 'DevOps', aliases: ['Microsoft Azure'] },
    { name: 'CI/CD', category: 'DevOps', aliases: ['GitHub Actions', 'GitLab CI'] },
    { name: 'Terraform', category: 'DevOps', aliases: ['IaC'] },

    // Mobile
    { name: 'React Native', category: 'Mobile', aliases: ['RN', 'Expo'] },
    { name: 'Flutter', category: 'Mobile', aliases: ['Dart'] },
    { name: 'Swift', category: 'Mobile', aliases: ['iOS', 'SwiftUI'] },
    { name: 'Kotlin', category: 'Mobile', aliases: ['Android', 'Kotlin Multiplatform'] },

    // AI & Machine Learning
    { name: 'PyTorch', category: 'Machine Learning', aliases: ['Torch'] },
    { name: 'TensorFlow', category: 'Machine Learning', aliases: ['TF', 'Keras'] },
    { name: 'LangChain', category: 'Machine Learning', aliases: ['LLM', 'LangGraph'] },
    { name: 'OpenAI API', category: 'Machine Learning', aliases: ['GPT', 'OpenAI'] },

    // Design
    { name: 'Figma', category: 'Design', aliases: ['UI Design', 'UX Design'] },
  ];

  for (const skill of standardSkills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        category: skill.category,
        aliases: skill.aliases,
      },
      create: {
        name: skill.name,
        category: skill.category,
        aliases: skill.aliases,
        status: 'approved',
      },
    });
  }

  console.log(`Seeding complete: ${configs.length} configs, ${standardSkills.length} skills.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
