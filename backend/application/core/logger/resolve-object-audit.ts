import mongoose from 'mongoose';

import { E_LOGGER_OBJECT_TYPE } from '../entity.core';

/**
 * Campos do REGISTRO referenciado por um log (creator/updatedBy/createdAt/
 * updatedAt), lidos da propria ROW de tabela dinamica.
 */
export type LoggerObjectAudit = {
  creator: mongoose.Types.ObjectId | null;
  updatedBy: mongoose.Types.ObjectId | null;
  objectCreatedAt: Date | null;
  objectUpdatedAt: Date | null;
};

export const EMPTY_OBJECT_AUDIT: LoggerObjectAudit = {
  creator: null,
  updatedBy: null,
  objectCreatedAt: null,
  objectUpdatedAt: null,
};

/** Extrai o slug da tabela de uma URL no padrao /tables/:slug/rows/... */
export function tableSlugFromRowUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const path = url.split('?')[0];
  const match = path.match(/\/tables\/([^/]+)\/rows/);
  return match ? match[1] : null;
}

function toObjectIdOrNull(value: unknown): mongoose.Types.ObjectId | null {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  try {
    return new mongoose.Types.ObjectId(String(value));
  } catch {
    return null;
  }
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Le creator/updatedBy/createdAt/updatedAt do REGISTRO referenciado por um log,
 * direto dos campos ja gravados na propria ROW.
 *
 * So resolve objetos do tipo ROW de tabela dinamica — as unicas entidades que
 * possuem os campos CREATOR + UPDATED_BY. Para os demais tipos (TABLE, FIELD,
 * USER, MENU, ...) retorna tudo null.
 *
 * Recebe as duas conexoes (system + data) como `Db` para ser reaproveitado tanto
 * no runtime (hook) quanto na migration standalone.
 */
export async function resolveLoggerObjectAudit(params: {
  systemDb: mongoose.mongo.Db;
  dataDb: mongoose.mongo.Db;
  object: string | null;
  objectId: string | null;
  url: string;
}): Promise<LoggerObjectAudit> {
  const { systemDb, dataDb, object, objectId, url } = params;

  if (object !== E_LOGGER_OBJECT_TYPE.ROW || !objectId) {
    return EMPTY_OBJECT_AUDIT;
  }

  const slug = tableSlugFromRowUrl(url);
  if (!slug) return EMPTY_OBJECT_AUDIT;

  const table = await systemDb
    .collection('tables')
    .findOne({ slug }, { projection: { _id: 1 } });
  if (!table) return EMPTY_OBJECT_AUDIT;

  const _id = toObjectIdOrNull(objectId);
  if (!_id) return EMPTY_OBJECT_AUDIT;

  const projection = { creator: 1, updatedBy: 1, createdAt: 1, updatedAt: 1 };

  // Linhas vivem no DB data (apos dual-connection). Fallback ao DB system para
  // instalacoes que ainda nao migraram/droparam o source.
  let row = await dataDb.collection(slug).findOne({ _id }, { projection });
  if (!row) {
    row = await systemDb.collection(slug).findOne({ _id }, { projection });
  }
  if (!row) return EMPTY_OBJECT_AUDIT;

  return {
    creator: toObjectIdOrNull(row.creator),
    updatedBy: toObjectIdOrNull(row.updatedBy),
    objectCreatedAt: toDateOrNull(row.createdAt),
    objectUpdatedAt: toDateOrNull(row.updatedAt),
  };
}
