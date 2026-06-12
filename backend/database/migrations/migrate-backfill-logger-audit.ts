/**
 * Migration: Backfill dos campos do registro referenciado nos logs (/logs).
 *
 * O historico de acoes (collection `logs`) passou a exibir, por linha, dados do
 * REGISTRO referenciado (object_id): quem criou, quem modificou por ultimo, e
 * quando. Esses dados sao gravados no log no momento da escrita (logger.hook),
 * mas logs antigos nao os possuem.
 *
 * Esta migration percorre os logs de objeto ROW (ROWs de tabela dinamica tem os
 * campos CREATOR/UPDATED_BY) e copia os valores atuais do registro para o log.
 * Logs de outros tipos de objeto ficam null. Idempotente: re-rodar produz o
 * mesmo resultado.
 *
 * Idempotente via marker no Setting singleton:
 *   MIGRATION_LOGGER_AUDIT_AT
 *
 * Usage:
 *   node --import @swc-node/register/esm-register \
 *     database/migrations/migrate-backfill-logger-audit.ts          # skip se ja migrado
 *   node ... migrate-backfill-logger-audit.ts -- --force            # re-run
 *
 * Environment variables required:
 *   DATABASE_URL     - MongoDB connection string
 *   DB_DATABASE      - System database name (logs + tables)
 *   DB_DATA_DATABASE - Data database name (dynamic row collections)
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

import { resolveLoggerObjectAudit } from '../../application/core/logger/resolve-object-audit';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const DB_DATA_DATABASE = process.env.DB_DATA_DATABASE || 'lowcodejs_data';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_LOGGER_AUDIT_AT?: Date | null;
};

async function backfillLoggerAudit(
  systemDb: mongoose.mongo.Db,
  dataDb: mongoose.mongo.Db,
): Promise<{ scanned: number; updated: number }> {
  const logsCol = systemDb.collection('logs');

  // Apenas logs de ROW: unica fonte confiavel de creator/updatedBy do objeto.
  const cursor = logsCol.find({ object: 'ROW' });

  let scanned = 0;
  let updated = 0;
  let batch: mongoose.mongo.AnyBulkWriteOperation[] = [];

  const flush = async (): Promise<void> => {
    if (batch.length === 0) return;
    const result = await logsCol.bulkWrite(batch);
    updated += result.modifiedCount ?? 0;
    batch = [];
  };

  for await (const log of cursor) {
    scanned++;

    const audit = await resolveLoggerObjectAudit({
      systemDb,
      dataDb,
      object: (log.object as string | null) ?? null,
      objectId: (log.object_id as string | null) ?? null,
      url: (log.url as string) ?? '',
    });

    // Sem fonte confiavel: nao toca no log (mantem null).
    if (
      !audit.creator &&
      !audit.updatedBy &&
      !audit.objectCreatedAt &&
      !audit.objectUpdatedAt
    ) {
      continue;
    }

    batch.push({
      updateOne: {
        filter: { _id: log._id },
        update: {
          $set: {
            creator: audit.creator,
            updatedBy: audit.updatedBy,
            objectCreatedAt: audit.objectCreatedAt,
            objectUpdatedAt: audit.objectUpdatedAt,
          },
        },
      },
    });

    if (batch.length >= 500) await flush();
  }

  await flush();

  return { scanned, updated };
}

async function migrate(): Promise<void> {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  console.info(`System DB: ${DB_DATABASE} | Data DB: ${DB_DATA_DATABASE}`);
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
    {
      MIGRATION_LOGGER_AUDIT_AT: { type: Date, default: null },
    },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = systemConn.model<SettingMarkerDoc>(
    'SettingMarker',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_LOGGER_AUDIT_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_LOGGER_AUDIT_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await backfillLoggerAudit(systemDb, dataDb);
    console.info('---');
    console.info(
      `Done. ROW logs scanned: ${result.scanned}, logs updated: ${result.updated}`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_LOGGER_AUDIT_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_LOGGER_AUDIT_AT recorded.');
  } finally {
    await systemConn.close();
    await dataConn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Migration failed:', error);
  process.exit(1);
});
