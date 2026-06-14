/**
 * Migration: backfill das flags de endpoint em campos RELATIONSHIP.
 *
 * Garante `visible` (top-level e em `relationship.visible`) em todo campo
 * RELATIONSHIP que ainda não o tenha — sem sobrescrever valores existentes e
 * sem tocar em `multiple` (que já existe) nem em `relationshipId` (preenchido
 * pela migration 15). Rede de segurança para campos que a 15 não cobriu.
 *
 * Idempotente via marker no Setting singleton:
 *   MIGRATION_RELATIONSHIP_ENDPOINT_FLAGS_AT
 *
 * Usage:
 *   npm run migrate:relationship-endpoint-flags
 *   npm run migrate:relationship-endpoint-flags -- --force
 *
 * Environment variables required:
 *   DATABASE_URL - MongoDB connection string
 *   DB_DATABASE  - System database name (fields)
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

import { TaskLogger } from '../shared/task-logger';

config({ path: '.env', quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');
const TITLE = 'Backfill de flags de endpoint (relationship)';

type SettingMarkerDoc = {
  MIGRATION_RELATIONSHIP_ENDPOINT_FLAGS_AT?: Date | null;
};

async function backfillFlags(
  systemDb: mongoose.mongo.Db,
): Promise<{ visibleRel: number }> {
  const fieldsCol = systemDb.collection('fields');

  // `visible` vive em `relationship.visible` (sub-schema), não no nível do campo.
  const visibleRel = await fieldsCol.updateMany(
    {
      type: 'RELATIONSHIP',
      relationship: { $ne: null },
      'relationship.visible': { $exists: false },
    },
    { $set: { 'relationship.visible': true } },
  );

  return { visibleRel: visibleRel.modifiedCount ?? 0 };
}

async function migrate(): Promise<void> {
  const logger = new TaskLogger(TITLE);

  if (!DATABASE_URL) {
    logger.failed('DATABASE_URL não configurada');
    process.exit(1);
  }

  const systemConn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATABASE,
  });
  await systemConn.asPromise();
  const systemDb = systemConn.db!;

  const SettingMarkerSchema = new mongoose.Schema(
    { MIGRATION_RELATIONSHIP_ENDPOINT_FLAGS_AT: { type: Date, default: null } },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = systemConn.model<SettingMarkerDoc>(
    'SettingMarkerRelEndpointFlags',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    const appliedAt = setting?.MIGRATION_RELATIONSHIP_ENDPOINT_FLAGS_AT;
    if (appliedAt && !FORCE) {
      logger.skipped(appliedAt);
      return;
    }

    logger.running();
    const result = await backfillFlags(systemDb);
    logger.done(`${result.visibleRel} relationship.visible preenchidos`);

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_RELATIONSHIP_ENDPOINT_FLAGS_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  } finally {
    await systemConn.close();
  }
}

migrate().catch((error: unknown): void => {
  new TaskLogger(TITLE).failed(error);
  process.exit(1);
});
