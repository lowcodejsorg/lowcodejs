/**
 * Migration: Backfill native fields in field groups.
 *
 * For every Table.groups[*], ensures that the 5 native fields defined in
 * FIELD_GROUP_NATIVE_LIST (_id, creator, createdAt, trashed, trashedAt) exist
 * in `groups[X].fields`. Missing natives are created in the `fields` collection
 * and their ObjectIds are appended to the group's `fields` array.
 *
 * Idempotent via marker in the Setting singleton:
 *   MIGRATION_GROUP_NATIVE_FIELDS_AT
 *
 * Usage:
 *   npm run migrate:group-native-fields            # backfill (skips if already migrated)
 *   npm run migrate:group-native-fields -- --force # re-run, ignoring marker
 *
 * Environment variables required:
 *   DATABASE_URL - MongoDB connection string
 *   DB_DATABASE  - System database name
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

import { FIELD_GROUP_NATIVE_LIST } from '../../application/core/entity.core';
import { TaskLogger } from '../shared/task-logger';

config({ path: '.env', quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');
const TITLE = 'Campos nativos dos grupos';

type SettingMarkerDoc = {
  MIGRATION_GROUP_NATIVE_FIELDS_AT?: Date | null;
};

async function backfillNativeFields(
  db: mongoose.mongo.Db,
  logger: TaskLogger,
): Promise<{
  tablesProcessed: number;
  groupsUpdated: number;
  fieldsCreated: number;
}> {
  const tablesCol = db.collection('tables');
  const fieldsCol = db.collection('fields');

  const tables = await tablesCol
    .find({ trashed: { $ne: true }, 'groups.0': { $exists: true } })
    .toArray();

  if (tables.length === 0) {
    return { tablesProcessed: 0, groupsUpdated: 0, fieldsCreated: 0 };
  }

  let groupsUpdated = 0;
  let fieldsCreated = 0;

  for (const table of tables) {
    let groups = [];
    if (Array.isArray(table.groups)) groups = table.groups;
    let tableChanged = false;

    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
      const group = groups[groupIdx];
      if (!group || typeof group !== 'object') continue;

      const groupSlug = group.slug;
      let fieldIds = [];
      if (Array.isArray(group.fields)) fieldIds = group.fields;

      const existingFields = await fieldsCol
        .find({ _id: { $in: fieldIds } })
        .project({ slug: 1 })
        .toArray();
      const existingSlugs = new Set(existingFields.map((f) => f.slug));

      const missingNatives = FIELD_GROUP_NATIVE_LIST.filter(
        (n) => !existingSlugs.has(n.slug),
      );

      if (missingNatives.length === 0) continue;

      const now = new Date();
      const docsToInsert = missingNatives.map((n) => ({
        ...n,
        group: { slug: groupSlug },
        widthInForm: n.widthInForm ?? 50,
        widthInList: n.widthInList ?? 10,
        widthInDetail: n.widthInDetail ?? 50,
        trashed: false,
        trashedAt: null,
        createdAt: now,
        updatedAt: now,
      }));

      const insertResult = await fieldsCol.insertMany(docsToInsert);
      const newIds = Object.values(insertResult.insertedIds);

      groups[groupIdx].fields = [...fieldIds, ...newIds];
      tableChanged = true;
      groupsUpdated++;
      fieldsCreated += newIds.length;

      const added = missingNatives.map((n) => n.slug).join(', ');
      logger.item(
        `${table.slug} → grupo "${groupSlug}" — +${newIds.length} nativos (${added})`,
      );
    }

    if (tableChanged) {
      await tablesCol.updateOne({ _id: table._id }, { $set: { groups } });
    }
  }

  return {
    tablesProcessed: tables.length,
    groupsUpdated,
    fieldsCreated,
  };
}

async function migrate(): Promise<void> {
  const logger = new TaskLogger(TITLE);

  if (!DATABASE_URL) {
    logger.failed('DATABASE_URL não configurada');
    process.exit(1);
  }

  const conn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATABASE,
  });
  await conn.asPromise();

  const db = conn.db!;

  const SettingMarkerSchema = new mongoose.Schema(
    {
      MIGRATION_GROUP_NATIVE_FIELDS_AT: { type: Date, default: null },
    },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarker',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    const appliedAt = setting?.MIGRATION_GROUP_NATIVE_FIELDS_AT;
    if (appliedAt && !FORCE) {
      logger.skipped(appliedAt);
      return;
    }

    logger.running();
    const result = await backfillNativeFields(db, logger);
    logger.done(
      `${result.tablesProcessed} tabelas, ${result.groupsUpdated} grupos, ${result.fieldsCreated} campos criados`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_GROUP_NATIVE_FIELDS_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  new TaskLogger(TITLE).failed(error);
  process.exit(1);
});
