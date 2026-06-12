/**
 * Migration: backfill da visibilidade de campo por contexto.
 *
 * Para cada campo ainda sem o mapa `permissions`, deriva `list`/`form`/`detail`
 * dos booleans legados showIn*: true -> PUBLIC (visível a todos), false ->
 * NOBODY (oculto). Mantém os booleans showIn* intactos.
 *
 * Idempotente via marker no Setting singleton:
 *   - MIGRATION_FIELD_PERMISSIONS_AT
 *
 * Usage:
 *   Dev: node --import @swc-node/register/esm-register database/migrations/migrate-field-permissions.ts
 *   Prod: node database/migrations/migrate-field-permissions.js
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_FIELD_PERMISSIONS_AT?: Date | null;
};

function binding(visible: boolean): { kind: string; group: null } {
  if (visible) return { kind: 'PUBLIC', group: null };
  return { kind: 'NOBODY', group: null };
}

async function backfillFieldPermissions(
  db: mongoose.mongo.Db,
): Promise<{ updated: number; total: number }> {
  const fields = db.collection('fields');
  const total = await fields.countDocuments();

  if (total === 0) {
    console.info('No field documents found. Nothing to backfill.');
    return { updated: 0, total: 0 };
  }

  const cursor = fields.find({
    $or: [{ permissions: { $exists: false } }, { permissions: null }],
  });

  let updated = 0;
  for await (const field of cursor) {
    const permissions = {
      list: binding(Boolean(field.showInList)),
      form: binding(Boolean(field.showInForm)),
      detail: binding(Boolean(field.showInDetail)),
    };

    await fields.updateOne({ _id: field._id }, { $set: { permissions } });
    updated += 1;
  }

  console.info(`Backfilled ${updated} field document(s).`);
  return { updated, total };
}

async function migrate(): Promise<void> {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  console.info(`Database: ${DB_DATABASE}`);
  if (FORCE) console.info('Force: true (bypassing marker)');
  console.info('---');

  const conn = mongoose.createConnection(DATABASE_URL, { dbName: DB_DATABASE });
  await conn.asPromise();

  const db = conn.db!;

  const SettingMarkerSchema = new mongoose.Schema(
    { MIGRATION_FIELD_PERMISSIONS_AT: { type: Date, default: null } },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerFieldPermissions',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_FIELD_PERMISSIONS_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_FIELD_PERMISSIONS_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await backfillFieldPermissions(db);
    console.info('---');
    console.info(`Done. Updated: ${result.updated}, Total: ${result.total}`);

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_FIELD_PERMISSIONS_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_FIELD_PERMISSIONS_AT recorded.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Field permissions migration failed:', error);
  process.exit(1);
});
