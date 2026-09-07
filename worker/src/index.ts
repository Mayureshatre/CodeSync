import { Worker } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const matchingWorker = new Worker('matching', async (job: any) => {
  console.log('Processing match recompute job', job.data);
  // In a real environment, this imports matchingService and recomputes
}, { connection: { url: REDIS_URL } });

matchingWorker.on('completed', (job: any) => {
  console.log(`${job.id} has completed!`);
});

matchingWorker.on('failed', (job: any, err: any) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

console.log('Worker is running...');
