/**
 * Migration: remove os campos legados de permissao dos documentos.
 *
 * Apos os backfills 09 (table-permissions), 10 (field-permissions) e 11
 * (menu-visibility) terem populado o novo modelo, os campos antigos viram dados
 * mortos. Esta migracao faz `$unset` deles:
 *   - tables: `visibility`, `collaboration`, `administrators`
 *   - fields: `showInList`, `showInForm`, `showInDetail`
 *
 * `showInFilter` NAO e removido: nao e permissao, e config da barra de filtros.
 *
 * Seguranca: so remove de documentos que JA possuem o novo modelo
 * (`permissions` presente e nao nulo) — assim, se por algum motivo um documento
 * nao foi migrado, seus campos legados sao preservados ate o backfill rodar.
 *
 * Idempotente via marker no Setting singleton:
 *   - MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT
 *
 * Usage:
 *   Dev: node --import @swc-node/register/esm-register database/migrations/migrate-drop-legacy-permission-fields.ts
 *   Prod: node database/migrations/migrate-drop-legacy-permission-fields.js
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT?: Date | null;
};

const MIGRATED_FILTER = {
  permissions: { $exists: true, $ne: null },
} as const;

async function dropLegacyFields(
  db: mongoose.mongo.Db,
): Promise<{ tables: number; fields: number }> {
  const tables = db.collection('tables');
  const fields = db.collection('fields');

  const tablesResult = await tables.updateMany(MIGRATED_FILTER, {
    $unset: { visibility: '', collaboration: '', administrators: '' },
  });

  const fieldsResult = await fields.updateMany(MIGRATED_FILTER, {
    $unset: {
      showInList: '',
      showInForm: '',
      showInDetail: '',
    },
  });

  console.info(
    `Cleaned ${tablesResult.modifiedCount} table(s) and ${fieldsResult.modifiedCount} field(s).`,
  );

  return {
    tables: tablesResult.modifiedCount,
    fields: fieldsResult.modifiedCount,
  };
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
    {
      MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT: { type: Date, default: null },
    },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerDropLegacyPermissionFields',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await dropLegacyFields(db);
    console.info('---');
    console.info(`Done. Tables: ${result.tables}, Fields: ${result.fields}`);

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT recorded.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Drop legacy permission fields migration failed:', error);
  process.exit(1);
});
