import { Worker, Job } from 'bullmq';
import { getPreferences, createNotification } from '@codesync/core/notificationService';
import { getEmailTransport } from '@codesync/core/emailTransport';
import { NotificationJobPayload } from '@codesync/core/queue';
import { prisma } from '@codesync/core/db';

export async function processNotificationJob(job: Job<NotificationJobPayload>) {
  const { notificationId, userId, category, payload } = job.data;
  
  // 1. Check preferences
  const prefs = await getPreferences(userId);
  const categoryPrefs = prefs[category];
  
  // If the category doesn't exist in preferences (which it should due to defaults), safe default is true
  const emailEnabled = categoryPrefs?.['EMAIL'] ?? true;
  
  if (!emailEnabled) {
    console.log(`[NotificationWorker] Skipping EMAIL for user ${userId} (category ${category} disabled)`);
    return;
  }

  // 2. Fetch user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user || !user.email) {
    console.log(`[NotificationWorker] Skipping EMAIL: user ${userId} has no email`);
    return;
  }

  // 3. Send email via transport
  const transport = getEmailTransport();
  
  try {
    await transport.sendEmail({
      to: user.email,
      subject: `New Notification: ${category}`,
      textBody: `You have a new ${category} notification. Payload: ${JSON.stringify(payload)}`
    });
    console.log(`[NotificationWorker] EMAIL sent to ${user.email} for category ${category}`);
  } catch (error: any) {
    // 4. Handle email failures (bounces, etc.)
    const isTransient = error.message.includes('timeout') || error.message.includes('rate limit');
    
    if (isTransient) {
      // Throw to let BullMQ retry with exponential backoff
      throw error;
    } else {
      // Permanent failure (e.g. bounce, invalid address, invalid API key in this context)
      console.error(`[NotificationWorker] Permanent EMAIL failure for ${user.email}: ${error.message}`);
      
      const systemInAppEnabled = prefs['SYSTEM']?.['IN_APP'] ?? true;

      // M8 explicitly requires surfacing permanent failures as a SYSTEM in-app notification
      if (systemInAppEnabled) {
        await createNotification(userId, 'SYSTEM', {
          event: 'EMAIL_DELIVERY_FAILED',
          category,
          reason: error.message,
          originalNotificationId: notificationId
        });
      }
      
      // Return normally so the job doesn't endlessly retry and clog the queue
      return;
    }
  }
}

export function startNotificationWorker(redisUrl: string) {
  const worker = new Worker('notification', processNotificationJob, { 
    connection: { url: redisUrl },
    concurrency: 5 // Process a few concurrently
  });

  worker.on('failed', (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
}
