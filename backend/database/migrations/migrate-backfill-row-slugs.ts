/**
 * Migration: backfill `sharedRowSlug` em rows dinâmicas existentes.
 *
 * O link amigável do registro (`/tables/:slug/:rowSlug`) é resolvido no backend
 * por busca estrita em `{ sharedRowSlug }` (sem slugify dinâmico em tempo de
 * leitura). Logo, registros criados ANTES de a tabela ter `rowSlugFieldId`
 * configurado ficam com `sharedRowSlug` nulo e a URL amigável retorna 404.
 *
 * Esta migration percorre toda tabela com `rowSlugFieldId` configurado e gera o
 * `sharedRowSlug` dos registros que ainda não têm, a partir do valor do campo
 * de slug — usando o MESMO algoritmo do create/update de row (`FieldSlug`).
 *
 * Idempotente: só preenche o que falta (nunca sobrescreve slug existente, pula
 * registros na lixeira e registros sem valor no campo). Marker no Setting evita
 * o full-scan em todo boot:
 *   MIGRATION_ROW_SLUG_BACKFILL_AT
 *
 * Re-rodar é seguro e necessário quando um MASTER ativa o campo de slug numa
 * tabela JÁ populada depois do primeiro backfill — use `--force`.
 *
 * Usage:
 *   node ... migrate-backfill-row-slugs.ts            # backfill (skip se marker setado)
 *   node ... migrate-backfill-row-slugs.ts --force    # re-roda ignorando o marker
 *
 * Environment variables required:
 *   DATABASE_URL     - MongoDB connection string
 *   DB_DATABASE      - System database name (tables/fields/settings)
 *   DB_DATA_DATABASE - Data database name (dynamic row collections)
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

import { FieldSlug } from '../../application/core/field-slug.core';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE ?? 'lowcodejs';
const DB_DATA_DATABASE = process.env.DB_DATA_DATABASE ?? 'lowcodejs_data';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_ROW_SLUG_BACKFILL_AT?: Date | null;
};

type MigrationStats = {
  tablesProcessed: number;
  rowsUpdated: number;
};

// Preenche sharedRowSlug numa única collection de dados. Retorna quantas rows
// foram atualizadas. Não toca rows com slug já definido, na lixeira ou sem valor.
async function backfillCollection(
  dataDb: mongoose.mongo.Db,
  slug: string,
  fieldSlug: string,
): Promise<number> {
  const collection = dataDb.collection(slug);

  // Seed do conjunto de slugs já usados (garante unicidade na geração nova).
  const existing = await collection.distinct('sharedRowSlug');
  const used = new Set<string>();
  for (const value of existing) {
    if (typeof value === 'string' && value.length > 0) used.add(value);
  }

  const candidates = await collection
    .find({
      $and: [
        {
          $or: [{ sharedRowSlug: { $exists: false } }, { sharedRowSlug: null }],
        },
        { $or: [{ trashedAt: { $exists: false } }, { trashedAt: null }] },
      ],
    })
    .toArray();

  let rowsUpdated = 0;

  for (const row of candidates) {
    const raw: unknown = row[fieldSlug];
    if (raw === null || raw === undefined || raw === '') continue;

    const generated = FieldSlug.suggestUnique(String(raw), Array.from(used));
    used.add(generated);

    await collection.updateOne(
      { _id: row._id },
      { $set: { sharedRowSlug: generated } },
    );
    rowsUpdated++;
  }

  return rowsUpdated;
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
    { MIGRATION_ROW_SLUG_BACKFILL_AT: { type: Date, default: null } },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = systemConn.model<SettingMarkerDoc>(
    'SettingMarkerRowSlugBackfill',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_ROW_SLUG_BACKFILL_AT && !FORCE) {
      console.info(
        `Already backfilled at ${setting.MIGRATION_ROW_SLUG_BACKFILL_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const tablesCol = systemDb.collection('tables');
    const fieldsCol = systemDb.collection('fields');

    // Só tabelas com campo de slug configurado têm sharedRowSlug a preencher.
    const tables = await tablesCol
      .find({ rowSlugFieldId: { $ne: null } })
      .toArray();

    if (tables.length === 0) {
      console.info(
        'No tables with rowSlugFieldId configured. Nothing to backfill.',
      );
    }

    const stats: MigrationStats = { tablesProcessed: 0, rowsUpdated: 0 };

    for (const table of tables) {
      const slug = table.slug;
      if (typeof slug !== 'string' || slug.length === 0) continue;

      const exists = await dataDb.listCollections({ name: slug }).hasNext();
      if (!exists) continue;

      // Resolve o campo de slug -> chave da coluna (field.slug) na row.
      const field = await fieldsCol.findOne({ _id: table.rowSlugFieldId });
      const fieldSlug = field?.slug;
      if (typeof fieldSlug !== 'string' || fieldSlug.length === 0) {
        console.info(`  [skip] ${slug} — campo de slug não encontrado`);
        continue;
      }

      const rowsUpdated = await backfillCollection(dataDb, slug, fieldSlug);

      stats.tablesProcessed++;
      stats.rowsUpdated += rowsUpdated;

      console.info(
        `  [ok] ${slug} — sharedRowSlug gerado em ${rowsUpdated} row(s)`,
      );
    }

    console.info('---');
    console.info(
      `Done. Tables: ${stats.tablesProcessed}, rows backfilled: ${stats.rowsUpdated}`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_ROW_SLUG_BACKFILL_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_ROW_SLUG_BACKFILL_AT recorded.');
  } finally {
    await systemConn.close();
    await dataConn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
