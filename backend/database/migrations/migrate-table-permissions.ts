/**
 * Migration: backfill do novo modelo de permissoes da tabela.
 *
 * Para cada tabela ainda sem o mapa `permissions`, deriva:
 *   - `permissions`: binding por acao (Grupo|Public|Nobody) a partir da
 *     `visibility` legada, seguindo a matriz "Colaboracao" da especificacao.
 *   - `members`: o `owner` vira membro OWNER e cada `administrators` vira ADMIN.
 *
 * "Usuario logado / todos os grupos" e mapeado para o grupo Registered (todos os
 * usuarios logados o satisfazem via hierarquia). "Visitante" vira PUBLIC. As
 * demais acoes ficam NOBODY (apenas dono e convidados, que tem acesso pelos
 * proprios perfis).
 *
 * Idempotente via marker no Setting singleton:
 *   - MIGRATION_TABLE_PERMISSIONS_AT
 *
 * Nao remove os campos legados (visibility/collaboration/administrators).
 *
 * Usage:
 *   Dev: node --import @swc-node/register/esm-register database/migrations/migrate-table-permissions.ts
 *   Prod: node database/migrations/migrate-table-permissions.js
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const FORCE = process.argv.includes('--force');

type SettingMarkerDoc = {
  MIGRATION_TABLE_PERMISSIONS_AT?: Date | null;
};

type Binding = { kind: string; group: mongoose.Types.ObjectId | null };

const TABLE_ACTIONS = [
  'VIEW_TABLE',
  'UPDATE_TABLE',
  'CREATE_FIELD',
  'UPDATE_FIELD',
  'REMOVE_FIELD',
  'VIEW_FIELD',
  'CREATE_ROW',
  'UPDATE_ROW',
  'REMOVE_ROW',
  'VIEW_ROW',
];

function buildPermissions(
  visibility: string | undefined,
  registeredId: mongoose.Types.ObjectId | null,
): Record<string, Binding> {
  const nobody = (): Binding => ({ kind: 'NOBODY', group: null });
  const publicAll = (): Binding => ({ kind: 'PUBLIC', group: null });
  const registered = (): Binding => ({ kind: 'GROUP', group: registeredId });

  const permissions: Record<string, Binding> = {};
  for (const action of TABLE_ACTIONS) {
    permissions[action] = nobody();
  }

  if (visibility === 'RESTRICTED') {
    permissions.VIEW_TABLE = registered();
    permissions.VIEW_ROW = registered();
  }

  if (visibility === 'OPEN') {
    permissions.VIEW_TABLE = registered();
    permissions.VIEW_ROW = registered();
    permissions.CREATE_ROW = registered();
  }

  if (visibility === 'PUBLIC') {
    permissions.VIEW_TABLE = publicAll();
    permissions.VIEW_ROW = publicAll();
    permissions.CREATE_ROW = registered();
  }

  if (visibility === 'FORM') {
    permissions.CREATE_ROW = publicAll();
  }

  // PRIVATE (e qualquer outro) -> tudo NOBODY (somente dono e convidados).
  return permissions;
}

function buildMembers(
  owner: mongoose.Types.ObjectId | null,
  administrators: mongoose.Types.ObjectId[],
): Array<{ user: mongoose.Types.ObjectId; profile: string }> {
  const members: Array<{ user: mongoose.Types.ObjectId; profile: string }> = [];

  if (owner) {
    members.push({ user: owner, profile: 'OWNER' });
  }

  for (const admin of administrators ?? []) {
    if (!admin) continue;
    if (owner && admin.toString() === owner.toString()) continue;
    members.push({ user: admin, profile: 'ADMIN' });
  }

  return members;
}

async function backfillTablePermissions(
  db: mongoose.mongo.Db,
): Promise<{ updated: number; total: number }> {
  const tables = db.collection('tables');
  const total = await tables.countDocuments();

  if (total === 0) {
    console.info('No table documents found. Nothing to backfill.');
    return { updated: 0, total: 0 };
  }

  const groups = db.collection('user-groups');
  const registered = await groups.findOne({ slug: 'REGISTERED' });
  const registeredId = registered?._id ?? null;

  if (!registeredId) {
    console.warn(
      'Registered group not found. Logged-user actions will fall back to NOBODY.',
    );
  }

  const cursor = tables.find({
    $or: [{ permissions: { $exists: false } }, { permissions: null }],
  });

  let updated = 0;
  for await (const table of cursor) {
    const permissions = buildPermissions(table.visibility, registeredId);
    const members = buildMembers(table.owner, table.administrators ?? []);

    await tables.updateOne(
      { _id: table._id },
      { $set: { permissions, members } },
    );
    updated += 1;
  }

  console.info(`Backfilled ${updated} table document(s).`);
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
    { MIGRATION_TABLE_PERMISSIONS_AT: { type: Date, default: null } },
    { strict: false, collection: 'settings' },
  );
  const SettingMarker = conn.model<SettingMarkerDoc>(
    'SettingMarkerTablePermissions',
    SettingMarkerSchema,
  );

  const setting = await SettingMarker.findOne({}).lean();

  try {
    if (setting?.MIGRATION_TABLE_PERMISSIONS_AT && !FORCE) {
      console.info(
        `Already migrated at ${setting.MIGRATION_TABLE_PERMISSIONS_AT.toISOString()}, skipping (use --force to re-run).`,
      );
      return;
    }

    const result = await backfillTablePermissions(db);
    console.info('---');
    console.info(`Done. Updated: ${result.updated}, Total: ${result.total}`);

    await SettingMarker.findOneAndUpdate(
      {},
      { $set: { MIGRATION_TABLE_PERMISSIONS_AT: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.info('Marker MIGRATION_TABLE_PERMISSIONS_AT recorded.');
  } finally {
    await conn.close();
  }
}

migrate().catch((error: unknown): void => {
  console.error('Table permissions migration failed:', error);
  process.exit(1);
});
