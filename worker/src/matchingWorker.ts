import { Job } from 'bullmq';
import { recomputeAndPersistMatch, recomputeAllForUser, recomputeAllForProject } from '@codesync/core/matchingService';

export type MatchingJobData = {
  userId?: string;
  projectId?: string;
};

export async function processMatchingJob(job: Job<MatchingJobData> | { id?: string; data: MatchingJobData }) {
  console.log(`[MatchingWorker] Processing match recompute job ${job.id}`, job.data);
  const { userId, projectId } = job.data;

  if (userId && projectId) {
    // Single-pair recompute: existing function is already optimal (two targeted findUnique calls)
    await recomputeAndPersistMatch(userId, projectId);
  } else if (userId) {
    // All projects for a user: fetch user once, iterate projects in memory
    await recomputeAllForUser(userId);
  } else if (projectId) {
    // All users for a project: fetch project once, iterate users in memory
    await recomputeAllForProject(projectId);
  }
}
