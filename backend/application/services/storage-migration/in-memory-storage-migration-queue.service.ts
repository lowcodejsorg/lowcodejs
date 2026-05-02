import {
  StorageMigrationQueueContractService,
  type ActiveJobInfo,
  type CleanupJobPayload,
  type MigrateJobPayload,
} from './storage-migration-queue-contract.service';

type Enqueued =
  | { type: 'migrate'; id: string; payload: MigrateJobPayload }
  | { type: 'cleanup'; id: string; payload: CleanupJobPayload };

export default class InMemoryStorageMigrationQueueService extends StorageMigrationQueueContractService {
  jobs: Enqueued[] = [];
  private active: ActiveJobInfo | null = null;

  async enqueueMigration(payload: MigrateJobPayload): Promise<string> {
    const id = `migrate:${Date.now()}-${this.jobs.length}`;
    this.jobs.push({ type: 'migrate', id, payload });
    this.active = { id, name: 'migrate', state: 'active', progress: 0 };
    return id;
  }

  async enqueueCleanup(payload: CleanupJobPayload): Promise<string> {
    const id = `cleanup:${Date.now()}-${this.jobs.length}`;
    this.jobs.push({ type: 'cleanup', id, payload });
    this.active = { id, name: 'cleanup', state: 'active', progress: 0 };
    return id;
  }

  async getActiveJob(): Promise<ActiveJobInfo | null> {
    return this.active;
  }

  async close(): Promise<void> {
    this.jobs = [];
    this.active = null;
  }

  // Test helpers
  clearActive(): void {
    this.active = null;
  }
}
