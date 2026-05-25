/**
 * Migration: backfill relationship.table._id in Field documents.
 *
 * Idempotent via marker field in the Setting singleton:
 *   - MIGRATION_RELATIONSHIP_TABLE_ID_AT (set after backfill completes)
 *
 * Safe to run on every container boot — second run is a no-op (single findOne).
 *
 * Finds all Field documents with type=RELATIONSHIP where relationship.table._id
 * is null or missing, looks up the Table by relationship.table.slug, and
 * backfills the _id. This makes relationship references slug-independent.
 *
 * Usage:
 *   npm run migrate:relationship-table-id           # backfill (skips if already done)
 *   npm run migrate:relationship-table-id -- --force # re-run ignoring marker
 *
 * Environment variables required:
 *   DATABASE_URL - MongoDB connection string
 *   DB_DATABASE  - System database name
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE ?? 'lowcodejs';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_RELATIONSHIP_TABLE_ID_AT?: Date | null;
};

type FieldMigrationDoc = {
  _id: mongoose.Types.ObjectId;
  relationship?: {
    table?: {
      _id?: mongoose.Types.ObjectId | null;
      slug?: string;
    };
  };
};

type TableMigrationDoc = {
  _id: mongoose.Types.ObjectId;
  slug: string;
};

const FieldSchema = new mongoose.Schema(
  {
    type: { type: String },
    relationship: {
      table: {
        _id: { type: mongoose.Schema.Types.ObjectId, default: null },
        slug: { type: String, default: null },
      },
    },
  },
  { strict: false, collection: 'fields' },
);

const TableSchema = new mongoose.Schema(
  {
    slug: { type: String },
  },
  { strict: false, collection: 'tables' },
);

const SettingMarkerSchema = new mongoose.Schema(
  { MIGRATION_RELATIONSHIP_TABLE_ID_AT: { type: Date, default: null } },
  { strict: false, collection: 'settings' },
);

async function backfillRelationshipTableId(
  FieldModel: mongoose.Model<FieldMigrationDoc>,
  TableModel: mongoose.Model<TableMigrationDoc>,
): Promise<{ updated: number; skipped: number }> {
  const fields = await FieldModel.find({
    type: 'RELATIONSHIP',
    $or: [
      { 'relationship.table._id': { $exists: false } },
      { 'relationship.table._id': null },
    ],
  }).lean();

  if (fields.length === 0) {
    console.info(
      'No fields with missing relationship.table._id found. Nothing to backfill.',
    );
    return { updated: 0, skipped: 0 };
  }

  console.info(
    `Found ${fields.length} field(s) with missing relationship.table._id.`,
  );

  let updated = 0;
  let skipped = 0;

  for (const field of fields) {
    const slug = field.relationship?.table?.slug;

    if (!slug) {
      console.warn(
        `Field ${field._id.toString()} has no relationship.table.slug — skipping.`,
      );
      skipped++;
      continue;
    }

    const table = await TableModel.findOne({ slug }).lean();

    if (!table) {
      console.warn(
        `Table with slug "${slug}" not found for field ${field._id.toString()} — skipping.`,
      );
      skipped++;
      continue;
    }

    await FieldModel.updateOne(
      { _id: field._id },
      { $set: { 'relationship.table._id': table._id } },
    );
    updated++;
    console.info(
      `Updated field ${field._id.toString()} → relationship.table._id = ${table._id.toString()}`,
    );
  }

  return { updated, skipped };
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

  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerRelTableId',
    SettingMarkerSchema,
  );
  const FieldModel = conn.model<FieldMigrationDoc>(
    'MigrationField',
    FieldSchema,
  );
  const TableModel = conn.model<TableMigrationDoc>(
    'MigrationTable',
    TableSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_RELATIONSHIP_TABLE_ID_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_RELATIONSHIP_TABLE_ID_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await backfillRelationshipTableId(FieldModel, TableModel);
    console.info('---');
    console.info(
      `Done. Updated: ${result.updated}, Skipped: ${result.skipped}`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_RELATIONSHIP_TABLE_ID_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_RELATIONSHIP_TABLE_ID_AT recorded.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Migration failed:', error);
  process.exit(1);
});
