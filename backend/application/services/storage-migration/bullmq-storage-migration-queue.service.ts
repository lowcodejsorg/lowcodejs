import { Queue } from 'bullmq';
import { Service } from 'fastify-decorators';

import { redis } from '@config/redis.config';

import {
  STORAGE_MIGRATION_JOB,
  STORAGE_MIGRATION_QUEUE_NAME,
  StorageMigrationQueueContractService,
  type ActiveJobInfo,
  type CleanupJobPayload,
  type MigrateJobPayload,
} from './storage-migration-queue-contract.service';

let cachedQueue: Queue | null = null;

function getQueue(): Queue {
  if (cachedQueue) return cachedQueue;
  cachedQueue = new Queue(STORAGE_MIGRATION_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 1, // we manage retries inside the worker per file
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    },
  });
  return cachedQueue;
}

@Service()
export default class BullMQStorageMigrationQueueService extends StorageMigrationQueueContractService {
  async enqueueMigration(payload: MigrateJobPayload): Promise<string> {
    const queue = getQueue();
    const jobId = `${STORAGE_MIGRATION_JOB.MIGRATE}:${Date.now()}`;
    const job = await queue.add(STORAGE_MIGRATION_JOB.MIGRATE, payload, {
      jobId,
    });
    return job.id ?? jobId;
  }

  async enqueueCleanup(payload: CleanupJobPayload): Promise<string> {
    const queue = getQueue();
    const jobId = `${STORAGE_MIGRATION_JOB.CLEANUP}:${Date.now()}`;
    const job = await queue.add(STORAGE_MIGRATION_JOB.CLEANUP, payload, {
      jobId,
    });
    return job.id ?? jobId;
  }

  async getActiveJob(): Promise<ActiveJobInfo | null> {
    const queue = getQueue();
    const jobs = await queue.getJobs(['active', 'waiting', 'delayed']);
    if (jobs.length === 0) return null;
    const job = jobs[0];
    const state = (await job.getState()) as ActiveJobInfo['state'];
    return {
      id: job.id ?? '',
      name: job.name as ActiveJobInfo['name'],
      state,
      progress: typeof job.progress === 'number' ? job.progress : 0,
    };
  }

  async close(): Promise<void> {
    if (cachedQueue) {
      await cachedQueue.close();
      cachedQueue = null;
    }
  }
}
