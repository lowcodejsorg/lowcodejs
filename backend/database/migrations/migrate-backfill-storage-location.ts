/**
 * Migration: backfill storage.location field on existing Storage docs.
 *
 * Idempotent via marker field in the Setting singleton:
 *   - MIGRATION_STORAGE_LOCATION_AT (set after backfill completes)
 *
 * Safe to run on every container boot — second run is a no-op (single findOne).
 *
 * Populates `location` and `migration_status` on every Storage doc that lacks
 * them. The active driver is read directly from the Setting singleton in the
 * database (NOT from process.env), since this migration runs before the server
 * boot (and therefore before syncStorageEnv).
 *
 * Usage:
 *   npm run migrate:backfill-storage-location           # backfill (skips if already done)
 *   npm run migrate:backfill-storage-location -- --force # re-run ignoring marker
 *
 * Environment variables required:
 *   DATABASE_URL - MongoDB connection string
 *   DB_DATABASE  - System database name
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  STORAGE_DRIVER?: 'local' | 's3' | null;
  MIGRATION_STORAGE_LOCATION_AT?: Date | null;
};

async function backfillStorageLocation(
  db: mongoose.mongo.Db,
  driver: 'local' | 's3',
): Promise<{ updated: number; total: number }> {
  const collection = db.collection('storage');
  const total = await collection.countDocuments();

  if (total === 0) {
    console.info('No storage documents found. Nothing to backfill.');
    return { updated: 0, total: 0 };
  }

  console.info(`Found ${total} storage document(s).`);

  const result = await collection.updateMany(
    {
      $or: [
        { location: { $exists: false } },
        { migration_status: { $exists: false } },
      ],
    },
    {
      $set: {
        location: driver,
        migration_status: 'idle',
      },
    },
  );

  console.info(
    `Backfilled ${result.modifiedCount} document(s) with location='${driver}' and migration_status='idle'.`,
  );

  return { updated: result.modifiedCount, total };
}

async function migrate(): Promise<void> {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  console.info(`Database: ${DB_DATABASE}`);
  if (FORCE) console.info('Force: true (bypassing marker)');
  console.info('---');

  const conn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATABASE,
  });
  await conn.asPromise();

  const db = conn.db!;

  const SettingMarkerSchema = new mongoose.Schema(
    {
      STORAGE_DRIVER: { type: String, default: null },
      MIGRATION_STORAGE_LOCATION_AT: { type: Date, default: null },
    },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerStorageLocation',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();
  const driver: 'local' | 's3' = setting?.STORAGE_DRIVER ?? 'local';
  console.info(`Active driver (read from Setting): ${driver}`);

  try {
    if (setting?.MIGRATION_STORAGE_LOCATION_AT && !FORCE) {
      console.info(
        `Already backfilled at ${setting.MIGRATION_STORAGE_LOCATION_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await backfillStorageLocation(db, driver);
    console.info('---');
    console.info(`Done. Updated: ${result.updated}, Total: ${result.total}`);

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_STORAGE_LOCATION_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_STORAGE_LOCATION_AT recorded.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
