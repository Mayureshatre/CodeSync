import { Worker, Job } from 'bullmq';
import { prisma } from '@codesync/core/db';
import { getAccountDeletionGraceDays } from '@codesync/core/configService';
import { sanitizeErrorMessage } from './utils';

export async function processAccountHardDeleteJob(job: Job<{ userId: string }>) {
  const { userId } = job.data;
  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      resume: true,
    }
  });

  // Idempotent guard 1: if user does not exist or status is not pending_deletion, do nothing
  if (!user || user.status !== 'pending_deletion') {
    return;
  }

  // Idempotent guard 2: verify grace period has genuinely expired
  const graceDays = await getAccountDeletionGraceDays();
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  if (user.deletionRequestedAt && (Date.now() < user.deletionRequestedAt.getTime() + graceMs)) {
    console.warn(`[AccountWorker] Job fired before grace period ended for user ${userId}. Skipping.`);
    return;
  }

  console.log(`[AccountWorker] Executing hard-delete for user ${userId}`);

  // Transaction: anonymize user and profile, wipe personal sub-records, retain project member and review history
  const didDelete = await prisma.$transaction(async (tx) => {
    // Atomic guard: update user ONLY if status is still pending_deletion.
    // If a concurrent restore occurred between the initial read and transaction execution,
    // count will be 0 and no data will be touched.
    const updateResult = await tx.user.updateMany({
      where: {
        id: userId,
        status: 'pending_deletion',
      },
      data: {
        email: `deleted_${user.id}@deleted.local`,
        passwordHash: null,
        mfaSecret: null,
        status: 'deleted',
        deletionRequestedAt: null,
        sessionVersion: { increment: 1 },
      }
    });

    if (updateResult.count === 0) {
      console.warn(`[AccountWorker] User ${userId} is no longer pending deletion (concurrent restore). Aborting.`);
      return false;
    }

    // Anonymize profile if it exists
    if (user.profile) {
      await tx.profile.update({
        where: { id: user.profile.id },
        data: {
          displayName: 'Former Collaborator',
          avatarUrl: null,
          bio: null,
          location: null,
          timezone: null,
          githubUrl: null,
          linkedinUrl: null,
          portfolioUrl: null,
          websiteUrl: null,
          profileVisibility: 'unlisted',
          availability: 'not_looking',
        }
      });
    }

    // Delete resume record if present
    if (user.resume) {
      await tx.resume.delete({
        where: { id: user.resume.id }
      });
    }

    // Delete personal profile sub-entities
    await tx.userSkill.deleteMany({ where: { userId } });
    await tx.experience.deleteMany({ where: { userId } });
    await tx.education.deleteMany({ where: { userId } });
    await tx.savedProject.deleteMany({ where: { userId } });
    await tx.savedDeveloper.deleteMany({ where: { userId } });

    return true;
  });

  if (didDelete) {
    console.log(`[AccountWorker] Successfully anonymized and hard-deleted PII for user ${userId}`);
  }
}

export function startAccountWorker(redisUrl: string) {
  const worker = new Worker('account', async (job) => {
    if (job.name === 'hard-delete') {
      await processAccountHardDeleteJob(job);
    }
  }, { connection: { url: redisUrl } });

  worker.on('failed', (job, err) => {
    console.error(`[AccountWorker] Job ${job?.id} failed with error:`, sanitizeErrorMessage(err?.message || String(err)));
  });

  worker.on('error', (err) => {
    console.error(`[AccountWorker] Connection error:`, sanitizeErrorMessage(err?.message || String(err)));
  });

  return worker;
}
