/**
 * Migration: introduce row `status`/`draftAt` and drop the row `trashed` boolean.
 *
 * The trash of dynamic rows is now controlled exclusively by `trashedAt`
 * (`trashedAt != null` => in trash). Drafts are tracked by `status` ('draft' |
 * 'published') + `draftAt`. This migration backfills existing dynamic rows (and
 * their embedded FIELD_GROUP items) in the DATA database:
 *
 *   1. status   -> 'published' where missing (legacy rows had no draft concept)
 *   2. draftAt  -> null where missing
 *   3. trashedAt-> null where missing (legacy trashed rows already carry it)
 *   4. $unset the obsolete `trashed` boolean
 *
 * Embedded group items get the same status/draftAt backfill via an aggregation
 * pipeline ($map). Their trash continues to be derived from `trashedAt`.
 *
 * Idempotent via marker in the Setting singleton:
 *   MIGRATION_ROW_STATUS_TRASHED_AT
 *
 * Usage:
 *   npm run migrate:row-status-trashed            # backfill (skips if already done)
 *   npm run migrate:row-status-trashed -- --force # re-run, ignoring marker
 *
 * Environment variables required:
 *   DATABASE_URL     - MongoDB connection string
 *   DB_DATABASE      - System database name (tables/fields/settings)
 *   DB_DATA_DATABASE - Data database name (dynamic row collections)
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE ?? 'lowcodejs';
const DB_DATA_DATABASE = process.env.DB_DATA_DATABASE ?? 'lowcodejs_data';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_ROW_STATUS_TRASHED_AT?: Date | null;
};

type MigrationStats = {
  collectionsProcessed: number;
  rowsUpdated: number;
  groupFieldsBackfilled: number;
};

async function backfillCollection(
  dataDb: mongoose.mongo.Db,
  slug: string,
  groupSlugs: string[],
): Promise<{ rowsUpdated: number; groupFieldsBackfilled: number }> {
  const collection = dataDb.collection(slug);

  const statusResult = await collection.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'published' } },
  );

  await collection.updateMany(
    { draftAt: { $exists: false } },
    { $set: { draftAt: null } },
  );

  await collection.updateMany(
    { trashedAt: { $exists: false } },
    { $set: { trashedAt: null } },
  );

  await collection.updateMany(
    { trashed: { $exists: true } },
    { $unset: { trashed: '' } },
  );

  let groupFieldsBackfilled = 0;

  for (const groupSlug of groupSlugs) {
    // Backfill status/draftAt em cada subitem do array embedded e remove o
    // boolean `trashed` legado. Itens incompletos (que tinham trashed=true)
    // viram 'draft'; os demais 'published'. trashedAt e preservado.
    await collection.updateMany({ [groupSlug]: { $type: 'array' } }, [
      {
        $set: {
          [groupSlug]: {
            $map: {
              input: `$${groupSlug}`,
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    status: {
                      $ifNull: [
                        '$$item.status',
                        {
                          $cond: [
                            { $eq: ['$$item.trashed', true] },
                            'draft',
                            'published',
                          ],
                        },
                      ],
                    },
                    draftAt: { $ifNull: ['$$item.draftAt', null] },
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    groupFieldsBackfilled++;
  }

  return {
    rowsUpdated: statusResult.modifiedCount,
    groupFieldsBackfilled,
  };
}

async function migrate(): Promise<void> {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  console.info(`System DB: ${DB_DATABASE}`);
  console.info(`Data DB: ${DB_DATA_DATABASE}`);
  if (FORCE) console.info('Force: true (bypassing marker)');
  console.info('---');

  const systemConn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATABASE,
  });
  await systemConn.asPromise();

  const dataConn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATA_DATABASE,
  });
  await dataConn.asPromise();

  const systemDb = systemConn.db!;
  const dataDb = dataConn.db!;

  const SettingMarkerSchema = new mongoose.Schema(
    { MIGRATION_ROW_STATUS_TRASHED_AT: { type: Date, default: null } },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = systemConn.model<SettingMarkerDoc>(
    'SettingMarkerRowStatusTrashed',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_ROW_STATUS_TRASHED_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_ROW_STATUS_TRASHED_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const tablesCol = systemDb.collection('tables');
    const fieldsCol = systemDb.collection('fields');

    const tables = await tablesCol.find({}).toArray();

    if (tables.length === 0) {
      console.info('No tables found. Nothing to migrate.');
    }

    const stats: MigrationStats = {
      collectionsProcessed: 0,
      rowsUpdated: 0,
      groupFieldsBackfilled: 0,
    };

    for (const table of tables) {
      const slug = table.slug;
      if (typeof slug !== 'string' || slug.length === 0) continue;

      const exists = await dataDb.listCollections({ name: slug }).hasNext();
      if (!exists) continue;

      const fieldIds = Array.isArray(table.fields) ? table.fields : [];
      const groupFields = await fieldsCol
        .find({ _id: { $in: fieldIds }, type: 'FIELD_GROUP' })
        .project({ slug: 1 })
        .toArray();
      const groupSlugs = groupFields
        .map((f) => f.slug)
        .filter((s): s is string => typeof s === 'string');

      const result = await backfillCollection(dataDb, slug, groupSlugs);

      stats.collectionsProcessed++;
      stats.rowsUpdated += result.rowsUpdated;
      stats.groupFieldsBackfilled += result.groupFieldsBackfilled;

      console.info(
        `  [ok] ${slug} — status backfilled in ${result.rowsUpdated} row(s), ${result.groupFieldsBackfilled} group field(s) processed`,
      );
    }

    console.info('---');
    console.info(
      `Done. Collections: ${stats.collectionsProcessed}, rows status-backfilled: ${stats.rowsUpdated}, group fields: ${stats.groupFieldsBackfilled}`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_ROW_STATUS_TRASHED_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_ROW_STATUS_TRASHED_AT recorded.');
  } finally {
    await systemConn.close();
    await dataConn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Migration failed:', error);
  process.exit(1);
});
