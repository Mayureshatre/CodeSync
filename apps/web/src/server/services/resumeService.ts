import { prisma } from '../db';
import { NotFoundError } from '../errors';
import { deleteObject, generatePresignedDownloadUrl } from './storageService';

export async function finalizeResumeUpload(userId: string, key: string) {
  // Find if there's an existing resume
  const existingResume = await prisma.resume.findUnique({
    where: { userId }
  });

  if (existingResume) {
    // Attempt to delete the old resume from S3, but don't fail the upload if it fails
    try {
      await deleteObject(existingResume.fileUrl, false);
    } catch (e) {
      console.error(`Failed to delete old resume object ${existingResume.fileUrl} for user ${userId}`, e);
    }
  }

  // Upsert the new resume record
  return prisma.resume.upsert({
    where: { userId },
    update: {
      fileUrl: key,
      status: 'pending',
      parsedAt: null
    },
    create: {
      userId,
      fileUrl: key,
      status: 'pending',
    }
  });
}

export async function getResumeDownloadUrl(userId: string) {
  const resume = await prisma.resume.findUnique({
    where: { userId }
  });

  if (!resume) {
    throw new NotFoundError('Resume not found');
  }

  // Generate short-lived GET url
  const url = await generatePresignedDownloadUrl(resume.fileUrl);
  return { url, status: resume.status, parsedAt: resume.parsedAt };
}

export async function deleteResume(userId: string) {
  const resume = await prisma.resume.findUnique({
    where: { userId }
  });

  if (!resume) {
    throw new NotFoundError('Resume not found');
  }

  await deleteObject(resume.fileUrl, false);
  
  await prisma.resume.delete({
    where: { userId }
  });
}
