/**
 * Migration: rename `slot: string | null` -> `slots: string[]` em todos os
 * documentos da collection `extensions`.
 *
 * Idempotente via marker no Setting singleton:
 *   - MIGRATION_EXTENSION_SLOTS_AT (set após renomear)
 *
 * Comportamento:
 *   - Se `slot` é string não vazia → `slots = [slot]`
 *   - Se `slot` é null/ausente → `slots = []`
 *   - Remove o campo `slot` em todos os casos
 *
 * Safe to run on every container boot — segunda execução é no-op.
 *
 * Uso:
 *   npm run migrate:extension-slots           # roda (skip se já migrado)
 *   npm run migrate:extension-slots -- --force # re-executa ignorando marker
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_EXTENSION_SLOTS_AT?: Date | null;
};

async function renameSlotField(
  db: mongoose.mongo.Db,
): Promise<{ withSlot: number; withoutSlot: number; total: number }> {
  const collection = db.collection('extensions');
  const total = await collection.countDocuments();

  if (total === 0) {
    console.info('Nenhum documento de extension encontrado. Nada a migrar.');
    return { withSlot: 0, withoutSlot: 0, total: 0 };
  }

  console.info(`Encontrado(s) ${total} documento(s) de extension.`);

  // 1) slot string → slots = [slot] (e remove slot)
  const cursorWithString = collection.find({
    slot: { $type: 'string', $ne: '' },
  });
  let withSlot = 0;
  for await (const doc of cursorWithString) {
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: { slots: [doc.slot] },
        $unset: { slot: '' },
      },
    );
    withSlot += 1;
  }

  // 2) slot null/ausente/vazio → slots = [] (e remove slot)
  const resultRest = await collection.updateMany(
    {
      $or: [
        { slot: null },
        { slot: '' },
        { slot: { $exists: false }, slots: { $exists: false } },
      ],
    },
    {
      $set: { slots: [] },
      $unset: { slot: '' },
    },
  );

  console.info(
    `Migrado(s): ${withSlot} com slot string, ${resultRest.modifiedCount} sem slot.`,
  );

  return {
    withSlot,
    withoutSlot: resultRest.modifiedCount,
    total,
  };
}

async function migrate(): Promise<void> {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL é obrigatório');
    process.exit(1);
  }

  console.info(`Database: ${DB_DATABASE}`);
  if (FORCE) console.info('Force: true (ignorando marker)');
  console.info('---');

  const conn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATABASE,
  });
  await conn.asPromise();

  const db = conn.db!;

  const SettingMarkerSchema = new mongoose.Schema(
    {
      MIGRATION_EXTENSION_SLOTS_AT: { type: Date, default: null },
    },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerExtensionSlots',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_EXTENSION_SLOTS_AT && !FORCE) {
      console.info(
        `Já migrado em ${setting.MIGRATION_EXTENSION_SLOTS_AT.toISOString()}, pulando (use --force para re-executar).`,
      );
      return;
    }

    const result = await renameSlotField(db);
    console.info('---');
    console.info(
      `Concluído. Total: ${result.total}, com slot: ${result.withSlot}, sem slot: ${result.withoutSlot}.`,
    );

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_EXTENSION_SLOTS_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_EXTENSION_SLOTS_AT registrado.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Migration falhou:', error);
  process.exit(1);
});
