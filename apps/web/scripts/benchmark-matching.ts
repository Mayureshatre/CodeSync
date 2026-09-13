import { computeMatchScore } from '../src/server/services/matchingService';

function generateMockProject() {
  return {
    id: 'proj-1',
    experienceRequirement: 'intermediate',
    collaborationType: ['remote', 'async'],
    tags: ['react', 'node', 'fullstack'],
    projectSkills: [
      { skillId: 'skill-1', minProficiency: 'intermediate', requirementType: 'required' },
      { skillId: 'skill-2', minProficiency: 'beginner', requirementType: 'preferred' },
    ]
  };
}

function generateMockUser(id: number) {
  return {
    id: `user-${id}`,
    profile: {
      availability: id % 10 === 0 ? 'not_looking' : 'available',
      experienceLevel: 'advanced',
      preferredCollaboration: ['remote'],
      // fields for profile completeness
      displayName: 'Dev',
      bio: 'Test bio',
    },
    userSkills: [
      { skillId: 'skill-1', proficiency: 'advanced', skill: { name: 'React' } },
      { skillId: 'skill-2', proficiency: 'intermediate', skill: { name: 'Node.js' } },
    ]
  };
}

async function runBenchmark() {
  console.log('--- Matching Computation Benchmark ---');
  const ITERATIONS = 100_000;
  
  const project = generateMockProject();
  const users = Array.from({ length: 1000 }, (_, i) => generateMockUser(i));

  let matchCount = 0;
  let nullCount = 0;
  
  const durations: number[] = [];

  // Warmup
  for (let i = 0; i < 1000; i++) {
    computeMatchScore(users[i % 1000], project);
  }

  // Benchmark
  for (let iter = 0; iter < ITERATIONS / users.length; iter++) {
    for (let i = 0; i < users.length; i++) {
      const start = process.hrtime.bigint();
      
      const result = computeMatchScore(users[i], project);
      
      const end = process.hrtime.bigint();
      durations.push(Number(end - start) / 1e6); // convert ns to ms
      
      if (result) matchCount++;
      else nullCount++;
    }
  }

  durations.sort((a, b) => a - b);
  const totalDuration = durations.reduce((acc, curr) => acc + curr, 0);
  const avgDuration = totalDuration / ITERATIONS;
  const p95 = durations[Math.floor(ITERATIONS * 0.95)];

  console.log(`Total Executions: ${ITERATIONS}`);
  console.log(`Total Duration: ${totalDuration.toFixed(2)} ms`);
  console.log(`Average Duration: ${avgDuration.toFixed(4)} ms`);
  console.log(`p95 Duration: ${p95?.toFixed(4) || 0} ms`);
  console.log(`Successful Matches: ${matchCount}`);
  console.log(`Filtered (Null): ${nullCount}`);
  console.log('--------------------------------------');
}

runBenchmark().catch(console.error);
