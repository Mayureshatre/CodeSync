import { prisma } from '../db';

export async function getPlatformConfig(key: string, defaultValue: string): Promise<string> {
  const config = await prisma.platformConfig.findUnique({
    where: { key }
  });
  return config ? config.value : defaultValue;
}

export async function getMatchSurfacingThreshold(): Promise<number> {
  const val = await getPlatformConfig('matchSurfacingThreshold', '75');
  return parseInt(val, 10);
}

export async function getReviewVisibilityWindowDays(): Promise<number> {
  const val = await getPlatformConfig('reviewVisibilityWindowDays', '14');
  return parseInt(val, 10);
}

export async function getAccountDeletionGraceDays(): Promise<number> {
  const val = await getPlatformConfig('accountDeletionGraceDays', '30');
  return parseInt(val, 10);
}
