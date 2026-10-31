import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface DeveloperSeed {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  timezone: string;
  availability: 'available' | 'open_to_projects' | 'busy' | 'not_looking';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredCollaboration: string[];
  profileVisibility: 'public' | 'unlisted';
  skills: Array<{
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsExperience: number;
  }>;
}

export interface ProjectSeed {
  slug: string;
  ownerEmail: string;
  name: string;
  description: string;
  problemStatement: string;
  goals: string;
  category: string;
  status: 'draft' | 'open';
  moderationHidden?: boolean;
  teamSizeTarget: number;
  durationEstimate: string;
  weeklyCommitment: string;
  remoteFlag: boolean;
  collaborationType: string[];
  visibility: 'open_source' | 'private';
  tags: string[];
  experienceRequirement: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skills: Array<{
    name: string;
    requirementType: 'required' | 'preferred';
    minProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  roles: Array<{
    title: string;
    slotsAvailable: number;
    skills: Array<{
      name: string;
      requirementType: 'required' | 'preferred';
      minProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    }>;
  }>;
}

export const TEST_DEVELOPERS: DeveloperSeed[] = [
  {
    email: 'elena.rostova@example.com',
    username: 'elena_rostova',
    displayName: 'Elena Rostova',
    bio: 'Full-stack TypeScript architect passionate about Next.js App Router, Tailwind CSS, and scalable PostgreSQL database design.',
    location: 'Berlin, Germany',
    timezone: 'Europe/Berlin',
    availability: 'available',
    experienceLevel: 'expert',
    preferredCollaboration: ['open_source', 'startup', 'side_project'],
    profileVisibility: 'public',
    skills: [
      { name: 'TypeScript', proficiency: 'expert', yearsExperience: 6 },
      { name: 'Next.js', proficiency: 'expert', yearsExperience: 4 },
      { name: 'React', proficiency: 'expert', yearsExperience: 6 },
      { name: 'PostgreSQL', proficiency: 'advanced', yearsExperience: 5 },
      { name: 'Tailwind CSS', proficiency: 'expert', yearsExperience: 4 },
      { name: 'Docker', proficiency: 'intermediate', yearsExperience: 3 },
    ],
  },
  {
    email: 'marcus.chen@example.com',
    username: 'marcus_chen',
    displayName: 'Marcus Chen',
    bio: 'Building LLM workflows and retrieval-augmented generation pipelines. Love Python, PyTorch, LangChain, and FastAPI.',
    location: 'Toronto, Canada',
    timezone: 'America/Toronto',
    availability: 'open_to_projects',
    experienceLevel: 'advanced',
    preferredCollaboration: ['startup', 'open_source', 'hackathon'],
    profileVisibility: 'public',
    skills: [
      { name: 'Python', proficiency: 'expert', yearsExperience: 5 },
      { name: 'PyTorch', proficiency: 'advanced', yearsExperience: 3 },
      { name: 'FastAPI', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'LangChain', proficiency: 'intermediate', yearsExperience: 2 },
      { name: 'Docker', proficiency: 'intermediate', yearsExperience: 3 },
      { name: 'PostgreSQL', proficiency: 'intermediate', yearsExperience: 3 },
    ],
  },
  {
    email: 'sarah.jenkins@example.com',
    username: 'sarah_jenkins',
    displayName: 'Sarah Jenkins',
    bio: 'Distributed systems and microservices enthusiast. Writing high-throughput Go and Rust services with Redis and Kubernetes.',
    location: 'London, United Kingdom',
    timezone: 'Europe/London',
    availability: 'available',
    experienceLevel: 'expert',
    preferredCollaboration: ['open_source', 'long_term'],
    profileVisibility: 'public',
    skills: [
      { name: 'Go', proficiency: 'expert', yearsExperience: 5 },
      { name: 'Rust', proficiency: 'advanced', yearsExperience: 3 },
      { name: 'Redis', proficiency: 'expert', yearsExperience: 5 },
      { name: 'Docker', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'Kubernetes', proficiency: 'advanced', yearsExperience: 3 },
      { name: 'PostgreSQL', proficiency: 'advanced', yearsExperience: 4 },
    ],
  },
  {
    email: 'amara.okafor@example.com',
    username: 'amara_okafor',
    displayName: 'Amara Okafor',
    bio: 'Mobile-first frontend developer crafting beautiful iOS and Android apps with React Native, TypeScript, and Flutter.',
    location: 'Nairobi, Kenya',
    timezone: 'Africa/Nairobi',
    availability: 'open_to_projects',
    experienceLevel: 'intermediate',
    preferredCollaboration: ['startup', 'side_project', 'hackathon'],
    profileVisibility: 'public',
    skills: [
      { name: 'React Native', proficiency: 'advanced', yearsExperience: 3 },
      { name: 'TypeScript', proficiency: 'intermediate', yearsExperience: 3 },
      { name: 'Flutter', proficiency: 'intermediate', yearsExperience: 2 },
      { name: 'JavaScript', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'Figma', proficiency: 'intermediate', yearsExperience: 2 },
    ],
  },
  {
    email: 'lucas.silva@example.com',
    username: 'lucas_silva',
    displayName: 'Lucas Silva',
    bio: 'Frontend craftsman obsessed with design systems, accessible UI components, Vue.js, Tailwind CSS, and Figma.',
    location: 'São Paulo, Brazil',
    timezone: 'America/Sao_Paulo',
    availability: 'available',
    experienceLevel: 'intermediate',
    preferredCollaboration: ['open_source', 'freelance', 'learning_project'],
    profileVisibility: 'public',
    skills: [
      { name: 'Vue.js', proficiency: 'advanced', yearsExperience: 3 },
      { name: 'JavaScript', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'Tailwind CSS', proficiency: 'advanced', yearsExperience: 3 },
      { name: 'Figma', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'HTML/CSS', proficiency: 'expert', yearsExperience: 5 },
    ],
  },
  {
    email: 'priya.sharma@example.com',
    username: 'priya_sharma',
    displayName: 'Priya Sharma',
    bio: 'Data pipelines, Postgres query tuning, and cloud infra. Working with Django, Python, AWS, and Supabase.',
    location: 'Bengaluru, India',
    timezone: 'Asia/Kolkata',
    availability: 'open_to_projects',
    experienceLevel: 'advanced',
    preferredCollaboration: ['open_source', 'startup'],
    profileVisibility: 'public',
    skills: [
      { name: 'Python', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'Django', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'PostgreSQL', proficiency: 'expert', yearsExperience: 5 },
      { name: 'AWS', proficiency: 'intermediate', yearsExperience: 3 },
      { name: 'Supabase', proficiency: 'advanced', yearsExperience: 2 },
    ],
  },
  {
    email: 'kaito.tanaka@example.com',
    username: 'kaito_tanaka',
    displayName: 'Kaito Tanaka',
    bio: 'Infrastructure as Code and CI/CD pipelines. Docker, Kubernetes, Terraform, AWS, and GCP automation.',
    location: 'Tokyo, Japan',
    timezone: 'Asia/Tokyo',
    availability: 'busy',
    experienceLevel: 'expert',
    preferredCollaboration: ['open_source', 'side_project'],
    profileVisibility: 'public',
    skills: [
      { name: 'Docker', proficiency: 'expert', yearsExperience: 6 },
      { name: 'Kubernetes', proficiency: 'expert', yearsExperience: 5 },
      { name: 'Terraform', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'CI/CD', proficiency: 'expert', yearsExperience: 5 },
      { name: 'AWS', proficiency: 'advanced', yearsExperience: 5 },
      { name: 'Go', proficiency: 'intermediate', yearsExperience: 2 },
    ],
  },
  {
    email: 'chloe.dubois@example.com',
    username: 'chloe_dubois',
    displayName: 'Chloe Dubois',
    bio: 'Junior developer eager to contribute to collaborative web apps. Proficient in HTML/CSS, JavaScript, and beginner React.',
    location: 'Paris, France',
    timezone: 'Europe/Paris',
    availability: 'available',
    experienceLevel: 'beginner',
    preferredCollaboration: ['learning_project', 'open_source', 'side_project'],
    profileVisibility: 'public',
    skills: [
      { name: 'HTML/CSS', proficiency: 'intermediate', yearsExperience: 2 },
      { name: 'JavaScript', proficiency: 'intermediate', yearsExperience: 2 },
      { name: 'React', proficiency: 'beginner', yearsExperience: 1 },
      { name: 'SQLite', proficiency: 'beginner', yearsExperience: 1 },
    ],
  },
  {
    email: 'david.miller@example.com',
    username: 'david_miller',
    displayName: 'David Miller',
    bio: 'Enterprise C# and .NET backend engineer. Currently taking a hiatus and not looking for new projects.',
    location: 'Austin, United States',
    timezone: 'America/Chicago',
    availability: 'not_looking', // Hard filter test: must be excluded from matching
    experienceLevel: 'advanced',
    preferredCollaboration: ['short_term'],
    profileVisibility: 'public',
    skills: [
      { name: 'C#', proficiency: 'expert', yearsExperience: 6 },
      { name: 'MySQL', proficiency: 'advanced', yearsExperience: 4 },
      { name: 'Azure', proficiency: 'advanced', yearsExperience: 4 },
    ],
  },
  {
    email: 'aisha.almansoor@example.com',
    username: 'aisha_almansoor',
    displayName: 'Aisha Al-Mansoor',
    bio: 'Systems security and Rust programming. Private profile test account.',
    location: 'Dubai, UAE',
    timezone: 'Asia/Dubai',
    availability: 'open_to_projects',
    experienceLevel: 'advanced',
    preferredCollaboration: ['open_source', 'freelance'],
    profileVisibility: 'unlisted', // Visibility test: must be excluded from public developer discovery
    skills: [
      { name: 'Rust', proficiency: 'expert', yearsExperience: 4 },
      { name: 'Go', proficiency: 'advanced', yearsExperience: 3 },
      { name: 'Docker', proficiency: 'intermediate', yearsExperience: 3 },
    ],
  },
];

export const TEST_PROJECTS: ProjectSeed[] = [
  {
    slug: 'test-aurorapulse-observability',
    ownerEmail: 'elena.rostova@example.com',
    name: 'AuroraPulse - Observability Dashboard',
    description: 'A modern, lightweight developer dashboard for visualizing serverless metrics and API latencies in real time.',
    problemStatement: 'Modern serverless applications lack unified, cost-effective latency telemetry.',
    goals: 'Ship v1.0 with open telemetry ingestion and customizable metric widgets.',
    category: 'Web Development',
    status: 'open',
    teamSizeTarget: 3,
    durationEstimate: '1_to_3_months',
    weeklyCommitment: 'part_time',
    remoteFlag: true,
    collaborationType: ['open_source', 'side_project'],
    visibility: 'open_source',
    tags: ['TypeScript', 'React', 'Observability', 'Next.js', 'PostgreSQL'],
    experienceRequirement: 'advanced',
    skills: [
      { name: 'TypeScript', requirementType: 'required', minProficiency: 'advanced' },
      { name: 'Next.js', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'Tailwind CSS', requirementType: 'preferred', minProficiency: 'intermediate' },
      { name: 'PostgreSQL', requirementType: 'preferred', minProficiency: 'intermediate' },
    ],
    roles: [
      {
        title: 'Frontend Visualizer',
        slotsAvailable: 1,
        skills: [
          { name: 'React', requirementType: 'required', minProficiency: 'advanced' },
          { name: 'Tailwind CSS', requirementType: 'preferred', minProficiency: 'intermediate' },
        ],
      },
      {
        title: 'Metric Pipeline Specialist',
        slotsAvailable: 1,
        skills: [
          { name: 'TypeScript', requirementType: 'required', minProficiency: 'intermediate' },
          { name: 'PostgreSQL', requirementType: 'preferred', minProficiency: 'intermediate' },
        ],
      },
    ],
  },
  {
    slug: 'test-synapserag-knowledge-search',
    ownerEmail: 'marcus.chen@example.com',
    name: 'SynapseRAG - Knowledge Base Search',
    description: 'Semantic document search and retrieval engine for engineering teams using hybrid vector indexes.',
    problemStatement: 'Engineering documentation is fragmented across repos, wikis, and chats.',
    goals: 'Build hybrid dense/sparse retrieval with FastAPI backend and Next.js frontend.',
    category: 'AI / Machine Learning',
    status: 'open',
    teamSizeTarget: 2,
    durationEstimate: '3_to_6_months',
    weeklyCommitment: 'part_time',
    remoteFlag: true,
    collaborationType: ['startup', 'open_source'],
    visibility: 'open_source',
    tags: ['Python', 'FastAPI', 'LangChain', 'AI', 'PyTorch'],
    experienceRequirement: 'advanced',
    skills: [
      { name: 'Python', requirementType: 'required', minProficiency: 'advanced' },
      { name: 'FastAPI', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'PyTorch', requirementType: 'preferred', minProficiency: 'intermediate' },
      { name: 'LangChain', requirementType: 'preferred', minProficiency: 'beginner' },
    ],
    roles: [
      {
        title: 'Backend AI Engineer',
        slotsAvailable: 1,
        skills: [
          { name: 'Python', requirementType: 'required', minProficiency: 'advanced' },
          { name: 'FastAPI', requirementType: 'required', minProficiency: 'intermediate' },
        ],
      },
    ],
  },
  {
    slug: 'test-kubeflow-cluster-autoscaler',
    ownerEmail: 'sarah.jenkins@example.com',
    name: 'KubeFlow - Cluster Autoscaler CLI',
    description: 'High-performance Kubernetes operator and CLI written in Go for predictive pod autoscaling based on queue depth.',
    problemStatement: 'Standard HPA reacts too slowly to sudden queue-depth spikes.',
    goals: 'Provide sub-second custom metric scaling for BullMQ and Kafka workloads.',
    category: 'DevOps',
    status: 'open',
    teamSizeTarget: 2,
    durationEstimate: '3_to_6_months',
    weeklyCommitment: 'full_time',
    remoteFlag: true,
    collaborationType: ['open_source'],
    visibility: 'open_source',
    tags: ['Go', 'Kubernetes', 'Docker', 'DevOps', 'CLI'],
    experienceRequirement: 'expert',
    skills: [
      { name: 'Go', requirementType: 'required', minProficiency: 'expert' },
      { name: 'Kubernetes', requirementType: 'required', minProficiency: 'advanced' },
      { name: 'Docker', requirementType: 'preferred', minProficiency: 'intermediate' },
      { name: 'Redis', requirementType: 'preferred', minProficiency: 'intermediate' },
    ],
    roles: [
      {
        title: 'Operator Developer',
        slotsAvailable: 1,
        skills: [
          { name: 'Go', requirementType: 'required', minProficiency: 'expert' },
          { name: 'Kubernetes', requirementType: 'required', minProficiency: 'advanced' },
        ],
      },
    ],
  },
  {
    slug: 'test-nomadnest-mobile-planner',
    ownerEmail: 'amara.okafor@example.com',
    name: 'NomadNest - Mobile Travel Planner',
    description: 'Offline-first mobile companion for digital nomads to map co-working spots and internet speeds.',
    problemStatement: 'Remote workers waste hours verifying co-working spaces and Wi-Fi reliability.',
    goals: 'Launch on iOS and Android test flight with community-submitted speed tests.',
    category: 'Mobile',
    status: 'open',
    teamSizeTarget: 2,
    durationEstimate: '1_to_3_months',
    weeklyCommitment: 'part_time',
    remoteFlag: true,
    collaborationType: ['startup', 'side_project'],
    visibility: 'open_source',
    tags: ['React Native', 'TypeScript', 'Mobile', 'Figma'],
    experienceRequirement: 'intermediate',
    skills: [
      { name: 'React Native', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'TypeScript', requirementType: 'required', minProficiency: 'beginner' },
      { name: 'Figma', requirementType: 'preferred', minProficiency: 'beginner' },
    ],
    roles: [
      {
        title: 'Mobile App Collaborator',
        slotsAvailable: 1,
        skills: [
          { name: 'React Native', requirementType: 'required', minProficiency: 'intermediate' },
        ],
      },
    ],
  },
  {
    slug: 'test-artisanui-design-system',
    ownerEmail: 'lucas.silva@example.com',
    name: 'ArtisanUI - Component Design System',
    description: 'An accessible, token-driven Vue.js component library featuring smooth spring animations and micro-interactions.',
    problemStatement: 'Modern Vue component libraries often lack fine-grained micro-interactions and dark-mode tokens.',
    goals: 'Publish 25 core components with 100% WCAG AA compliance.',
    category: 'Design Systems',
    status: 'open',
    teamSizeTarget: 3,
    durationEstimate: 'less_than_1_month',
    weeklyCommitment: 'hobby',
    remoteFlag: true,
    collaborationType: ['open_source', 'learning_project'],
    visibility: 'open_source',
    tags: ['Vue.js', 'Tailwind CSS', 'Figma', 'UI Design'],
    experienceRequirement: 'intermediate',
    skills: [
      { name: 'Vue.js', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'Tailwind CSS', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'Figma', requirementType: 'preferred', minProficiency: 'beginner' },
      { name: 'HTML/CSS', requirementType: 'preferred', minProficiency: 'intermediate' },
    ],
    roles: [
      {
        title: 'Design System Engineer',
        slotsAvailable: 2,
        skills: [
          { name: 'Vue.js', requirementType: 'required', minProficiency: 'intermediate' },
        ],
      },
    ],
  },
  {
    slug: 'test-dataforge-schema-migration',
    ownerEmail: 'priya.sharma@example.com',
    name: 'DataForge - Automated Schema Migration Engine',
    description: 'Zero-downtime database migration advisor and safe schema linter for PostgreSQL and Supabase.',
    problemStatement: 'Table-locking DDL statements cause production downtime in growing startups.',
    goals: 'Analyze Prisma and Django migrations and flag dangerous lock escalations.',
    category: 'Database',
    status: 'open',
    teamSizeTarget: 2,
    durationEstimate: '3_to_6_months',
    weeklyCommitment: 'part_time',
    remoteFlag: true,
    collaborationType: ['open_source', 'startup'],
    visibility: 'open_source',
    tags: ['PostgreSQL', 'Python', 'Django', 'Supabase'],
    experienceRequirement: 'advanced',
    skills: [
      { name: 'PostgreSQL', requirementType: 'required', minProficiency: 'advanced' },
      { name: 'Python', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'Django', requirementType: 'preferred', minProficiency: 'intermediate' },
    ],
    roles: [
      {
        title: 'Database Reliability Engineer',
        slotsAvailable: 1,
        skills: [
          { name: 'PostgreSQL', requirementType: 'required', minProficiency: 'advanced' },
        ],
      },
    ],
  },
  {
    slug: 'test-terravault-secrets-manager',
    ownerEmail: 'kaito.tanaka@example.com',
    name: 'TerraVault - Infrastructure Secrets Manager',
    description: 'Terraform provider plugin and CLI tool for ephemeral secret injection across AWS and GCP environments.',
    problemStatement: 'Developers commit environment secrets or store static tokens in CI pipelines.',
    goals: 'Automate short-lived IAM credentials rotation during CI/CD execution.',
    category: 'DevOps',
    status: 'open',
    teamSizeTarget: 2,
    durationEstimate: '1_to_3_months',
    weeklyCommitment: 'hobby',
    remoteFlag: true,
    collaborationType: ['open_source'],
    visibility: 'open_source',
    tags: ['Terraform', 'Docker', 'AWS', 'CI/CD'],
    experienceRequirement: 'expert',
    skills: [
      { name: 'Terraform', requirementType: 'required', minProficiency: 'advanced' },
      { name: 'Docker', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'AWS', requirementType: 'preferred', minProficiency: 'intermediate' },
      { name: 'CI/CD', requirementType: 'preferred', minProficiency: 'intermediate' },
    ],
    roles: [
      {
        title: 'Cloud Security Engineer',
        slotsAvailable: 1,
        skills: [
          { name: 'Terraform', requirementType: 'required', minProficiency: 'advanced' },
        ],
      },
    ],
  },
  {
    slug: 'test-devbeginner-mentorship-portal',
    ownerEmail: 'chloe.dubois@example.com',
    name: 'DevBeginner - Community Mentorship Portal',
    description: 'A welcoming, open-source community platform pairing junior developers with open issues and code mentors.',
    problemStatement: 'New developers struggle to make their first open-source contributions.',
    goals: 'Create an issue explorer tailored to first-time pull request contributors.',
    category: 'Web Development',
    status: 'open',
    teamSizeTarget: 4,
    durationEstimate: 'less_than_1_month',
    weeklyCommitment: 'hobby',
    remoteFlag: true,
    collaborationType: ['learning_project', 'open_source'],
    visibility: 'open_source',
    tags: ['JavaScript', 'HTML/CSS', 'React', 'Mentorship'],
    experienceRequirement: 'beginner',
    skills: [
      { name: 'JavaScript', requirementType: 'required', minProficiency: 'beginner' },
      { name: 'HTML/CSS', requirementType: 'required', minProficiency: 'beginner' },
      { name: 'React', requirementType: 'preferred', minProficiency: 'beginner' },
    ],
    roles: [
      {
        title: 'Junior Web Contributor',
        slotsAvailable: 3,
        skills: [
          { name: 'JavaScript', requirementType: 'required', minProficiency: 'beginner' },
        ],
      },
    ],
  },
  {
    slug: 'test-rustkv-storage-engine',
    ownerEmail: 'sarah.jenkins@example.com',
    name: 'RustKV - Embedded Storage Engine',
    description: 'Log-structured merge tree storage engine written in Rust with C-ABI and Go bindings.',
    problemStatement: 'Existing embedded key-value stores are either written in C++ or lack async support.',
    goals: 'Achieve 200,000 IOPS write throughput on standard NVMe drives.',
    category: 'Systems Programming',
    status: 'open',
    teamSizeTarget: 2,
    durationEstimate: 'more_than_6_months',
    weeklyCommitment: 'part_time',
    remoteFlag: true,
    collaborationType: ['open_source'],
    visibility: 'open_source',
    tags: ['Rust', 'Go', 'Database', 'Systems'],
    experienceRequirement: 'expert',
    skills: [
      { name: 'Rust', requirementType: 'required', minProficiency: 'advanced' },
      { name: 'Go', requirementType: 'preferred', minProficiency: 'intermediate' },
    ],
    roles: [
      {
        title: 'Core Storage Engineer',
        slotsAvailable: 1,
        skills: [
          { name: 'Rust', requirementType: 'required', minProficiency: 'advanced' },
        ],
      },
    ],
  },
  {
    slug: 'test-gameloom-webgl-pipeline',
    ownerEmail: 'lucas.silva@example.com',
    name: 'GameLoom - WebGL Asset Pipeline',
    description: 'Browser-based 3D mesh compressor and texture optimizer for Three.js and WebGL games.',
    problemStatement: '3D asset files are too large for seamless web game loading.',
    goals: 'Implement Draco and KTX2 compression in the browser via WebAssembly.',
    category: 'Gaming / Graphics',
    status: 'open',
    teamSizeTarget: 2,
    durationEstimate: '1_to_3_months',
    weeklyCommitment: 'hobby',
    remoteFlag: true,
    collaborationType: ['open_source', 'side_project'],
    visibility: 'open_source',
    tags: ['JavaScript', 'TypeScript', 'Figma', 'Graphics'],
    experienceRequirement: 'intermediate',
    skills: [
      { name: 'JavaScript', requirementType: 'required', minProficiency: 'intermediate' },
      { name: 'TypeScript', requirementType: 'preferred', minProficiency: 'intermediate' },
    ],
    roles: [
      {
        title: 'WebGL Tooling Contributor',
        slotsAvailable: 1,
        skills: [
          { name: 'JavaScript', requirementType: 'required', minProficiency: 'intermediate' },
        ],
      },
    ],
  },
  {
    slug: 'test-draft-experiment',
    ownerEmail: 'elena.rostova@example.com',
    name: 'DraftProject - Unpublished Concept',
    description: 'An unreleased draft experiment that must not be surfaced in public project searches.',
    problemStatement: 'Testing draft project search exclusion.',
    goals: 'Verify p.status = open filter.',
    category: 'Web Development',
    status: 'draft', // Draft test: must NOT be surfaced in searchProjects
    teamSizeTarget: 1,
    durationEstimate: '1_to_3_months',
    weeklyCommitment: 'part_time',
    remoteFlag: true,
    collaborationType: ['side_project'],
    visibility: 'open_source',
    tags: ['TypeScript', 'React'],
    experienceRequirement: 'expert',
    skills: [
      { name: 'TypeScript', requirementType: 'required', minProficiency: 'expert' },
    ],
    roles: [],
  },
  {
    slug: 'test-moderated-safety-review',
    ownerEmail: 'marcus.chen@example.com',
    name: 'ModeratedProject - Hidden Flag Test',
    description: 'A project flagged by moderation that must be excluded by moderationHidden = false filter.',
    problemStatement: 'Testing moderation filter behavior.',
    goals: 'Verify p.moderationHidden = false filter.',
    category: 'AI / Machine Learning',
    status: 'open',
    moderationHidden: true, // Moderation test: must NOT be surfaced in searchProjects
    teamSizeTarget: 2,
    durationEstimate: '1_to_3_months',
    weeklyCommitment: 'part_time',
    remoteFlag: true,
    collaborationType: ['open_source'],
    visibility: 'open_source',
    tags: ['Python', 'AI'],
    experienceRequirement: 'intermediate',
    skills: [
      { name: 'Python', requirementType: 'required', minProficiency: 'intermediate' },
    ],
    roles: [],
  },
];

export interface SafetyCheckResult {
  isSafe: boolean;
  targetEnv?: 'local' | 'staging';
  host?: string;
  database?: string;
  reason?: string;
}

export function checkDatabaseSafety(): SafetyCheckResult {
  const dbUrl = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) {
    return { isSafe: false, reason: 'No database URL found (checked STAGING_DATABASE_URL, DATABASE_URL, DIRECT_URL).' };
  }

  let host = 'unknown';
  let database = 'unknown';
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, '');
  } catch (e) {
    return { isSafe: false, reason: 'Failed to parse database connection URL.' };
  }

  const maskedHost = host.length > 6
    ? `${host.slice(0, 3)}***${host.slice(-3)}`
    : '***';

  const lowerDb = database.toLowerCase();
  const lowerHost = host.toLowerCase();
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const codesyncEnv = (process.env.CODESYNC_ENV || process.env.TARGET_ENV || '').toLowerCase();

  // 1. HARD PRODUCTION GUARDS (Fail-Closed)
  if (codesyncEnv === 'production' || nodeEnv === 'production') {
    return {
      isSafe: false,
      host: maskedHost,
      database,
      reason: 'REFUSAL: Target environment is explicitly set to production. Dummy data seeding is strictly prohibited in production.',
    };
  }

  if (lowerDb === 'codesync_production' || lowerDb === 'production' || lowerDb.endsWith('_prod')) {
    return {
      isSafe: false,
      host: maskedHost,
      database,
      reason: `REFUSAL: Target database "${database}" appears to be a production database. Dummy data seeding is prohibited.`,
    };
  }

  // 2. LOCAL ENVIRONMENT (localhost / 127.0.0.1)
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.includes('local');
  if (isLocalHost) {
    const allowDev = process.env.ALLOW_DEV_SEED === 'true' || process.argv.includes('--confirm');
    if (!allowDev) {
      return {
        isSafe: false,
        host: maskedHost,
        database,
        reason: `Running against local database (${maskedHost} / ${database}) requires explicit confirmation. Please run with --confirm or set ALLOW_DEV_SEED=true.`,
      };
    }
    return {
      isSafe: true,
      targetEnv: 'local',
      host: maskedHost,
      database,
    };
  }

  // 3. EXPLICIT STAGING ENVIRONMENT (Remote / Isolated Cloud DB)
  // Non-local databases MUST be verified as staging through explicit multi-variable confirmation.
  const isStagingEnv = codesyncEnv === 'staging';
  const allowStaging = process.env.ALLOW_STAGING_SEED === 'true';
  const confirmTarget = process.env.CONFIRM_STAGING_TARGET?.trim();

  if (!isStagingEnv) {
    return {
      isSafe: false,
      host: maskedHost,
      database,
      reason: `REFUSAL: Remote database detected (${maskedHost}). Remote databases can only be targeted in staging mode. To seed a staging database, set CODESYNC_ENV=staging.`,
    };
  }

  if (!allowStaging) {
    return {
      isSafe: false,
      host: maskedHost,
      database,
      reason: `REFUSAL: Staging mode requires explicit confirmation. Set ALLOW_STAGING_SEED=true.`,
    };
  }

  if (!confirmTarget) {
    return {
      isSafe: false,
      host: maskedHost,
      database,
      reason: `REFUSAL: Staging target confirmation required. You must set CONFIRM_STAGING_TARGET=<database_name_or_host_fragment> matching your intended staging database or host.`,
    };
  }

  const lowerConfirm = confirmTarget.toLowerCase();
  if (lowerConfirm === 'prod' || lowerConfirm === 'production') {
    return {
      isSafe: false,
      host: maskedHost,
      database,
      reason: 'REFUSAL: CONFIRM_STAGING_TARGET cannot be "prod" or "production".',
    };
  }

  const targetMatches = lowerDb.includes(lowerConfirm) || lowerHost.includes(lowerConfirm);
  if (!targetMatches) {
    return {
      isSafe: false,
      host: maskedHost,
      database,
      reason: `REFUSAL: CONFIRM_STAGING_TARGET ("${confirmTarget}") does not match the configured database target (${maskedHost} / ${database}). Aborting.`,
    };
  }

  return {
    isSafe: true,
    targetEnv: 'staging',
    host: maskedHost,
    database,
  };
}

export async function cleanupDiscoveryData(prisma: PrismaClient) {
  console.log('Initiating safe cleanup of test discovery dataset...');
  const testEmails = TEST_DEVELOPERS.map((d) => d.email);
  const testSlugs = TEST_PROJECTS.map((p) => p.slug);

  // 1. Delete matches involving test projects or test users
  await prisma.match.deleteMany({
    where: {
      OR: [
        { user: { email: { in: testEmails } } },
        { project: { slug: { in: testSlugs } } },
      ],
    },
  });

  // 2. Delete test projects (cascades to projectSkills, projectRoles, etc.)
  const deletedProjects = await prisma.project.deleteMany({
    where: { slug: { in: testSlugs } },
  });

  // 3. Delete test users (cascades to profile, userSkills, etc.)
  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  console.log(`Cleaned up ${deletedProjects.count} test projects and ${deletedUsers.count} test developers.`);
}

export async function seedDiscoveryData(prisma: PrismaClient) {
  console.log('Beginning safe seed of discovery test dataset...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Cache standard skills
  const skillsInDb = await prisma.skill.findMany();
  const skillMap = new Map<string, string>();
  for (const s of skillsInDb) {
    skillMap.set(s.name.toLowerCase(), s.id);
  }

  // Helper to ensure skill exists
  async function getOrCreateSkill(name: string): Promise<string> {
    const lower = name.toLowerCase();
    if (skillMap.has(lower)) return skillMap.get(lower)!;
    const created = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name, category: 'General', status: 'approved', aliases: [] },
    });
    skillMap.set(lower, created.id);
    return created.id;
  }

  // 2. Upsert Developers
  const userMap = new Map<string, string>(); // email -> userId
  for (const dev of TEST_DEVELOPERS) {
    const user = await prisma.user.upsert({
      where: { email: dev.email },
      update: {
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      create: {
        email: dev.email,
        passwordHash,
        authProvider: 'credentials',
        emailVerifiedAt: new Date(), // verified so they can own/publish projects
        status: 'active',
        role: 'user',
        profile: {
          create: {
            username: dev.username,
            displayName: dev.displayName,
            bio: dev.bio,
            location: dev.location,
            timezone: dev.timezone,
            availability: dev.availability,
            experienceLevel: dev.experienceLevel,
            preferredCollaboration: dev.preferredCollaboration,
            profileVisibility: dev.profileVisibility,
          },
        },
      },
      include: { profile: true },
    });

    userMap.set(dev.email, user.id);

    // Update profile if user existed
    if (user.profile) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          username: dev.username,
          displayName: dev.displayName,
          bio: dev.bio,
          location: dev.location,
          timezone: dev.timezone,
          availability: dev.availability,
          experienceLevel: dev.experienceLevel,
          preferredCollaboration: dev.preferredCollaboration,
          profileVisibility: dev.profileVisibility,
        },
      });
    }

    // Upsert UserSkills
    for (const sk of dev.skills) {
      const skillId = await getOrCreateSkill(sk.name);
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: user.id,
            skillId,
          },
        },
        update: {
          proficiency: sk.proficiency,
          yearsExperience: sk.yearsExperience,
        },
        create: {
          userId: user.id,
          skillId,
          proficiency: sk.proficiency,
          yearsExperience: sk.yearsExperience,
        },
      });
    }
    console.log(`  Seeded developer: ${dev.displayName} (${dev.email})`);
  }

  // 3. Upsert Projects
  const projectMap = new Map<string, string>(); // slug -> projectId
  for (const proj of TEST_PROJECTS) {
    const ownerId = userMap.get(proj.ownerEmail);
    if (!ownerId) {
      console.warn(`  Skipping project ${proj.name}: owner ${proj.ownerEmail} not found`);
      continue;
    }

    const existing = await prisma.project.findUnique({
      where: { slug: proj.slug },
    });

    let projectId: string;
    if (existing) {
      await prisma.project.update({
        where: { id: existing.id },
        data: {
          name: proj.name,
          description: proj.description,
          problemStatement: proj.problemStatement,
          goals: proj.goals,
          category: proj.category,
          status: proj.status,
          moderationHidden: proj.moderationHidden || false,
          teamSizeTarget: proj.teamSizeTarget,
          durationEstimate: proj.durationEstimate,
          weeklyCommitment: proj.weeklyCommitment,
          remoteFlag: proj.remoteFlag,
          collaborationType: proj.collaborationType,
          visibility: proj.visibility,
          tags: proj.tags,
          experienceRequirement: proj.experienceRequirement,
          publishedAt: proj.status === 'open' ? new Date() : null,
        },
      });
      projectId = existing.id;
      // Clean old skills & roles for idempotence
      await prisma.projectSkill.deleteMany({ where: { projectId } });
      await prisma.projectRole.deleteMany({ where: { projectId } });
    } else {
      const created = await prisma.project.create({
        data: {
          ownerId,
          slug: proj.slug,
          name: proj.name,
          description: proj.description,
          problemStatement: proj.problemStatement,
          goals: proj.goals,
          category: proj.category,
          status: proj.status,
          moderationHidden: proj.moderationHidden || false,
          teamSizeTarget: proj.teamSizeTarget,
          durationEstimate: proj.durationEstimate,
          weeklyCommitment: proj.weeklyCommitment,
          remoteFlag: proj.remoteFlag,
          collaborationType: proj.collaborationType,
          visibility: proj.visibility,
          tags: proj.tags,
          experienceRequirement: proj.experienceRequirement,
          publishedAt: proj.status === 'open' ? new Date() : null,
        },
      });
      projectId = created.id;
    }

    projectMap.set(proj.slug, projectId);

    // Create ProjectSkills
    for (const ps of proj.skills) {
      const skillId = await getOrCreateSkill(ps.name);
      await prisma.projectSkill.create({
        data: {
          projectId,
          skillId,
          requirementType: ps.requirementType,
          minProficiency: ps.minProficiency,
        },
      });
    }

    // Create ProjectRoles
    for (const pr of proj.roles) {
      const role = await prisma.projectRole.create({
        data: {
          projectId,
          title: pr.title,
          slotsAvailable: pr.slotsAvailable,
        },
      });
      for (const prs of pr.skills) {
        const skillId = await getOrCreateSkill(prs.name);
        await prisma.projectRoleSkill.create({
          data: {
            projectRoleId: role.id,
            skillId,
            requirementType: prs.requirementType,
            minProficiency: prs.minProficiency,
          },
        });
      }
    }
    console.log(`  Seeded project: ${proj.name} [${proj.status}]`);
  }

  // 4. Precompute explicit test Match pairs for deterministic relevance testing
  console.log('Seeding baseline Match pairs for relevance ranking...');
  const elenaId = userMap.get('elena.rostova@example.com');
  const auroraPulseId = projectMap.get('test-aurorapulse-observability');
  if (elenaId && auroraPulseId) {
    await prisma.match.upsert({
      where: { userId_projectId: { userId: elenaId, projectId: auroraPulseId } },
      update: { score: 98.5, computedAt: new Date() },
      create: {
        userId: elenaId,
        projectId: auroraPulseId,
        score: 98.5,
        factorBreakdown: {
          skills: 100,
          experience: 100,
          collaboration: 100,
          availability: 100,
          techInterest: 100,
          completeness: 90,
        },
        algorithmVersion: 1,
      },
    });
  }

  const marcusId = userMap.get('marcus.chen@example.com');
  const synapseRagId = projectMap.get('test-synapserag-knowledge-search');
  if (marcusId && synapseRagId) {
    await prisma.match.upsert({
      where: { userId_projectId: { userId: marcusId, projectId: synapseRagId } },
      update: { score: 96.0, computedAt: new Date() },
      create: {
        userId: marcusId,
        projectId: synapseRagId,
        score: 96.0,
        factorBreakdown: {
          skills: 95,
          experience: 100,
          collaboration: 100,
          availability: 80,
          techInterest: 100,
          completeness: 95,
        },
        algorithmVersion: 1,
      },
    });
  }

  const lucasId = userMap.get('lucas.silva@example.com');
  const gameLoomId = projectMap.get('test-gameloom-webgl-pipeline');
  if (lucasId && gameLoomId) {
    await prisma.match.upsert({
      where: { userId_projectId: { userId: lucasId, projectId: gameLoomId } },
      update: { score: 62.0, computedAt: new Date() },
      create: {
        userId: lucasId,
        projectId: gameLoomId,
        score: 62.0,
        factorBreakdown: {
          skills: 50,
          experience: 100,
          collaboration: 100,
          availability: 100,
          techInterest: 50,
          completeness: 85,
        },
        algorithmVersion: 1,
      },
    });
  }

  console.log(`Seeding complete: ${TEST_DEVELOPERS.length} developers, ${TEST_PROJECTS.length} projects seeded.`);
}

async function main() {
  const isClean = process.argv.includes('--clean');
  const safety = checkDatabaseSafety();

  if (!safety.isSafe) {
    console.error('\n==================== [SAFETY REFUSAL] ====================');
    console.error(safety.reason);
    console.error('==========================================================\n');
    process.exit(1);
  }

  console.log(`Database safety check PASSED [Target: ${safety.targetEnv}, Host: ${safety.host}, DB: ${safety.database}].`);
  const targetUrl = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
  const prisma = new PrismaClient(targetUrl ? { datasources: { db: { url: targetUrl } } } : undefined);

  try {
    if (isClean) {
      await cleanupDiscoveryData(prisma);
    } else {
      await seedDiscoveryData(prisma);
    }
  } catch (error) {
    console.error('Execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export function isDirectExecution(): boolean {
  if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    return true;
  }
  if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
    return /seed-discovery(\.[cm]?[jt]s)?$/i.test(process.argv[1]);
  }
  return false;
}

// Only execute directly when run from CLI (compatible with both CJS and ESM)
if (isDirectExecution()) {
  main();
}
