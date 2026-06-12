/**
 * Migration: backfill da visibilidade das opções de menu.
 *
 * Define `visibility = { kind: 'PUBLIC', group: null }` em menus que ainda não
 * têm o campo (comportamento legado: menu visível a todos).
 *
 * Idempotente via marker no Setting singleton:
 *   - MIGRATION_MENU_VISIBILITY_AT
 *
 * Usage:
 *   Dev: node --import @swc-node/register/esm-register database/migrations/migrate-menu-visibility.ts
 *   Prod: node database/migrations/migrate-menu-visibility.js
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_MENU_VISIBILITY_AT?: Date | null;
};

async function backfillMenuVisibility(
  db: mongoose.mongo.Db,
): Promise<{ updated: number; total: number }> {
  const menus = db.collection('menus');
  const total = await menus.countDocuments();

  if (total === 0) {
    console.info('No menu documents found. Nothing to backfill.');
    return { updated: 0, total: 0 };
  }

  const result = await menus.updateMany(
    { $or: [{ visibility: { $exists: false } }, { visibility: null }] },
    { $set: { visibility: { kind: 'PUBLIC', group: null } } },
  );

  console.info(`Backfilled ${result.modifiedCount} menu document(s).`);
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

  const conn = mongoose.createConnection(DATABASE_URL, { dbName: DB_DATABASE });
  await conn.asPromise();

  const db = conn.db!;

  const SettingMarkerSchema = new mongoose.Schema(
    { MIGRATION_MENU_VISIBILITY_AT: { type: Date, default: null } },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerMenuVisibility',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_MENU_VISIBILITY_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_MENU_VISIBILITY_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await backfillMenuVisibility(db);
    console.info('---');
    console.info(`Done. Updated: ${result.updated}, Total: ${result.total}`);

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_MENU_VISIBILITY_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_MENU_VISIBILITY_AT recorded.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Menu visibility migration failed:', error);
  process.exit(1);
});
