/**
 * Migration: backfill allowCreateRelationshipRecords on existing Field docs.
 *
 * Idempotent via marker field in the Setting singleton:
 *   - MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT
 *
 * The migration never overwrites existing values. It only sets
 * `allowCreateRelationshipRecords=false` on Field documents where the property
 * does not exist yet.
 *
 * Usage:
 *   The Docker entrypoint runs this migration automatically on container boot.
 *   Development: node --import @swc-node/register/esm-register database/migrations/migrate-backfill-relationship-create-records.ts
 *   Production:  node database/migrations/migrate-backfill-relationship-create-records.js
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
  MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT?: Date | null;
};

async function backfillRelationshipCreateRecords(
  db: mongoose.mongo.Db,
): Promise<{ updated: number; missing: number; total: number }> {
  const collection = db.collection('fields');
  const total = await collection.countDocuments();

  if (total === 0) {
    console.info('No field documents found. Nothing to backfill.');
    return { updated: 0, missing: 0, total: 0 };
  }

  const missing = await collection.countDocuments({
    allowCreateRelationshipRecords: { $exists: false },
  });

  if (missing === 0) {
    console.info(
      'All field documents already have allowCreateRelationshipRecords. Nothing to backfill.',
    );
    return { updated: 0, missing: 0, total };
  }

  console.info(
    `Found ${missing} field document(s) missing allowCreateRelationshipRecords out of ${total}.`,
  );

  const result = await collection.updateMany(
    {
      allowCreateRelationshipRecords: { $exists: false },
    },
    {
      $set: {
        allowCreateRelationshipRecords: false,
      },
    },
  );

  console.info(
    `Backfilled ${result.modifiedCount} field document(s) with allowCreateRelationshipRecords=false.`,
  );

  return { updated: result.modifiedCount, missing, total };
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
      MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT: {
        type: Date,
        default: null,
      },
    },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerRelationshipCreateRecords',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT && !FORCE) {
      console.info(
        `Already backfilled at ${setting.MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await backfillRelationshipCreateRecords(db);
    console.info('---');
    console.info(
      `Done. Updated: ${result.updated}, Missing before run: ${result.missing}, Total: ${result.total}`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT recorded.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
