/**
 * Migration: Move dynamic collections from system DB to data DB.
 *
 * Idempotent via marker fields in the Setting singleton:
 *   - MIGRATION_DUAL_CONNECTION_AT          (set after copy completes)
 *   - MIGRATION_DUAL_CONNECTION_DROPPED_AT  (set after --drop-source completes)
 *
 * Safe to run on every container boot — second run is a no-op (single findOne).
 *
 * Usage:
 *   npm run migrate:dual-connection                     # copy (skips if already migrated)
 *   npm run migrate:dual-connection -- --force          # copy again, ignoring marker
 *   npm run migrate:dual-connection -- --drop-source    # drop source collections (requires prior migration)
 *
 * Environment variables required:
 *   DATABASE_URL     - MongoDB connection string
 *   DB_DATABASE      - System database name (source)
 *   DB_DATA_DATABASE - Data database name (target)
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const DB_DATA_DATABASE = process.env.DB_DATA_DATABASE || 'lowcodejs_data';
const DROP_SOURCE = process.argv.includes('--drop-source');
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_DUAL_CONNECTION_AT?: Date | null;
  MIGRATION_DUAL_CONNECTION_DROPPED_AT?: Date | null;
};

function isMongoDuplicateKeyError(e: unknown): e is Error & { code: number } {
  return e instanceof Error && 'code' in e;
}

async function copyCollections(
  sourceDb: mongoose.mongo.Db,
  targetDb: mongoose.mongo.Db,
): Promise<{ migrated: number; skipped: number; total: number }> {
  const tables = await sourceDb
    .collection('tables')
    .find({ trashed: { $ne: true } })
    .project({ slug: 1 })
    .toArray();

  if (tables.length === 0) {
    console.info('No tables found. Nothing to migrate.');
    return { migrated: 0, skipped: 0, total: 0 };
  }

  console.info(`Found ${tables.length} table(s) to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const table of tables) {
    const slug = table.slug;
    if (!slug) {
      skipped++;
      continue;
    }

    const sourceCollections = await sourceDb
      .listCollections({ name: slug })
      .toArray();

    if (sourceCollections.length === 0) {
      console.info(`  [skip] ${slug} — collection not found in source`);
      skipped++;
      continue;
    }

    const sourceCol = sourceDb.collection(slug);
    const count = await sourceCol.countDocuments();

    if (count === 0) {
      console.info(`  [skip] ${slug} — empty collection`);
      skipped++;
      continue;
    }

    const docs = await sourceCol.find().toArray();
    const targetCol = targetDb.collection(slug);

    try {
      await targetCol.insertMany(docs, { ordered: false });
    } catch (error: unknown) {
      if (isMongoDuplicateKeyError(error) && error.code === 11000) {
        console.info(
          `  [partial] ${slug} — some duplicates skipped (${count} docs)`,
        );
      } else {
        console.error(`  [error] ${slug} — ${error}`);
        continue;
      }
    }

    console.info(`  [ok] ${slug} — ${count} document(s) migrated`);
    migrated++;
  }

  return { migrated, skipped, total: tables.length };
}

async function dropSourceCollections(
  sourceDb: mongoose.mongo.Db,
): Promise<{ dropped: number; skipped: number; total: number }> {
  const tables = await sourceDb
    .collection('tables')
    .find({ trashed: { $ne: true } })
    .project({ slug: 1 })
    .toArray();

  let dropped = 0;
  let skipped = 0;

  for (const table of tables) {
    const slug = table.slug;
    if (!slug) {
      skipped++;
      continue;
    }

    const sourceCollections = await sourceDb
      .listCollections({ name: slug })
      .toArray();

    if (sourceCollections.length === 0) {
      console.info(`  [skip] ${slug} — collection not found in source`);
      skipped++;
      continue;
    }

    await sourceDb.dropCollection(slug);
    console.info(`  [drop] ${slug} — removed from source`);
    dropped++;
  }

  return { dropped, skipped, total: tables.length };
}

async function migrate(): Promise<void> {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  console.info(`Source DB: ${DB_DATABASE}`);
  console.info(`Target DB: ${DB_DATA_DATABASE}`);
  console.info(`Mode:      ${DROP_SOURCE ? 'drop-source' : 'copy'}`);
  if (FORCE) console.info('Force:     true (bypassing marker)');
  console.info('---');

  const sourceConn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATABASE,
  });
  await sourceConn.asPromise();

  const targetConn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATA_DATABASE,
  });
  await targetConn.asPromise();

  const sourceDb = sourceConn.db!;
  const targetDb = targetConn.db!;

  // Local Setting schema (strict:false so we don't need to mirror all 28 fields).
  // Only the migration markers matter here.
  const SettingMarkerSchema = new mongoose.Schema(
    {
      MIGRATION_DUAL_CONNECTION_AT: { type: Date, default: null },
      MIGRATION_DUAL_CONNECTION_DROPPED_AT: { type: Date, default: null },
    },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = sourceConn.model<SettingMarkerDoc>(
    'SettingMarker',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (DROP_SOURCE) {
      if (!setting?.MIGRATION_DUAL_CONNECTION_AT) {
        console.error(
          'Refusing to drop: copy migration has not been recorded yet. ' +
            'Run `npm run migrate:dual-connection` first.',
        );
        process.exit(1);
      }

      if (setting?.MIGRATION_DUAL_CONNECTION_DROPPED_AT && !FORCE) {
        console.info(
          `Source already dropped at ${setting.MIGRATION_DUAL_CONNECTION_DROPPED_AT.toISOString()}, skipping (use --force to re-run).`,
        );
        return;
      }

      const result = await dropSourceCollections(sourceDb);
      console.info('---');
      console.info(
        `Done. Dropped: ${result.dropped}, Skipped: ${result.skipped}, Total: ${result.total}`,
      );

      await SettingMarker.findOneAndUpdate(
        {},
        { $set: { MIGRATION_DUAL_CONNECTION_DROPPED_AT: new Date() } },
        { upsert: true, setDefaultsOnInsert: true },
      );
      console.info('Marker MIGRATION_DUAL_CONNECTION_DROPPED_AT recorded.');
      return;
    }

    if (setting?.MIGRATION_DUAL_CONNECTION_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_DUAL_CONNECTION_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await copyCollections(sourceDb, targetDb);
    console.info('---');
    console.info(
      `Done. Migrated: ${result.migrated}, Skipped: ${result.skipped}, Total: ${result.total}`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_DUAL_CONNECTION_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_DUAL_CONNECTION_AT recorded.');
  } finally {
    await sourceConn.close();
    await targetConn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Migration failed:', error);
  process.exit(1);
});
