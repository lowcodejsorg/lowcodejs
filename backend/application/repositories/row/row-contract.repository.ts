/* eslint-disable no-unused-vars */
import type { IRow, ITable, Optional } from '@application/core/entity.core';

/**
 * Contexto de uma tabela dinamica para que o repositorio
 * consiga construir o modelo Mongoose e os populates.
 * Usa o mesmo tipo que buildTable() espera.
 */
export type RowTableContext = Optional<
  ITable,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

// ── Payloads ────────────────────────────────────────────────

export type RowCreatePayload = {
  table: RowTableContext;
  data: Record<string, unknown>;
};

export type RowFindOnePayload = {
  table: RowTableContext;
  query: Record<string, unknown>;
  populate?: boolean;
};

export type RowFindManyPayload = {
  table: RowTableContext;
  rawFilters?: Record<string, unknown>;
  skip: number;
  limit: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  /** Fragmento extra de query Mongo (e.g. do row-access-guard). Mesclado via $and no filtro final. */
  guardQuery?: Record<string, unknown>;
  /** IDs a excluir do resultado (filtro excludeLinked no autocomplete 1:1/N:N). */
  excludeIds?: string[];
};

export type RowUpdatePayload = {
  table: RowTableContext;
  _id: string;
  data: Record<string, unknown>;
};

export type RowSetFieldPayload = {
  table: RowTableContext;
  _id: string;
  field: string;
  value: unknown;
};

export type RowBulkUpdatePayload = {
  table: RowTableContext;
  ids: string[];
  // Convidado contributor ("apenas a sua"): escopa a operacao apenas aos
  // registros criados por este usuario. Ausente = sem escopo de dono.
  creatorId?: string;
};

export type RowBulkDeletePayload = {
  table: RowTableContext;
  ids: string[];
  // Convidado contributor ("apenas a sua"): escopa a operacao apenas aos
  // registros criados por este usuario. Ausente = sem escopo de dono.
  creatorId?: string;
};

export type RowUpdateManyPayload = {
  table: RowTableContext;
  filter: Record<string, unknown>;
  update: Record<string, unknown>;
};

export type RowGroupItemPayload = {
  table: RowTableContext;
  rowId: string;
  groupFieldSlug: string;
};

// ── Contrato ────────────────────────────────────────────────

export abstract class RowContractRepository {
  // ── Core CRUD ─────────────────────────────────────────────

  abstract create(payload: RowCreatePayload): Promise<IRow>;

  abstract findOne(payload: RowFindOnePayload): Promise<IRow | null>;

  abstract findMany(payload: RowFindManyPayload): Promise<IRow[]>;

  abstract count(
    table: RowTableContext,
    rawFilters?: Record<string, unknown>,
    guardQuery?: Record<string, unknown>,
  ): Promise<number>;

  /**
   * Conta rows (nao-trashed) cujo campo `fieldSlug` seja exatamente `value`,
   * ignorando `excludeRowId` (a propria row no update). Match exato — usada pela
   * validacao de unicidade (IS_UNIQUE / ARE_UNIQUE_VALUES). Difere de `count`,
   * que passa pelo QueryBuilder e trata TEXT como `$regex` parcial.
   */
  abstract countFieldValue(
    table: RowTableContext,
    fieldSlug: string,
    value: unknown,
    excludeRowId?: string | null,
  ): Promise<number>;

  abstract update(payload: RowUpdatePayload): Promise<IRow | null>;

  abstract deleteOne(table: RowTableContext, _id: string): Promise<boolean>;

  /** Lista os `sharedRowSlug` ja usados na tabela (para garantir unicidade). */
  abstract listSlugs(
    table: RowTableContext,
    excludeId?: string,
  ): Promise<string[]>;

  // ── Trash (bulk) ──────────────────────────────────────────

  abstract bulkTrash(payload: RowBulkUpdatePayload): Promise<number>;

  abstract bulkRestore(payload: RowBulkUpdatePayload): Promise<number>;

  abstract bulkDelete(payload: RowBulkDeletePayload): Promise<number>;

  abstract emptyTrash(
    table: RowTableContext,
    creatorId?: string,
  ): Promise<number>;

  // ── Field-level (reaction / evaluation) ───────────────────

  abstract setFieldAndSave(payload: RowSetFieldPayload): Promise<IRow>;

  // ── Group rows (subdocumentos) ────────────────────────────

  abstract addGroupItem(
    payload: RowGroupItemPayload & { data: Record<string, unknown> },
  ): Promise<IRow>;

  abstract updateGroupItem(
    payload: RowGroupItemPayload & {
      itemId: string;
      data: Record<string, unknown>;
    },
  ): Promise<IRow>;

  abstract deleteGroupItem(
    payload: RowGroupItemPayload & { itemId: string },
  ): Promise<boolean>;

  // ── Atomic update (forum-message / backfill) ──────────────

  abstract findOneAndUpdate(
    table: RowTableContext,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<IRow | null>;

  /**
   * Atualiza TODAS as rows que correspondam ao filtro.
   * Usado pelo RowAccessGuard para backfill de rows sem o campo de visibilidade.
   * Idempotente: nenhum efeito se nenhuma row corresponder.
   */
  abstract updateMany(payload: RowUpdateManyPayload): Promise<number>;

  // ── Infrastructure-level ops (table/import/export tools) ──

  abstract renameField(
    table: RowTableContext,
    oldSlug: string,
    newSlug: string,
  ): Promise<void>;

  abstract findAllRaw(
    table: RowTableContext,
  ): Promise<Record<string, unknown>[]>;

  abstract insertRaw(
    table: RowTableContext,
    row: Record<string, unknown>,
    creator?: string,
  ): Promise<IRow>;

  // ── Resolver helpers (csv-import) ─────────────────────────

  /**
   * Busca rows onde qualquer um dos `fieldSlugs` contenha algum dos `values`
   * (case-insensitive). Ignora rows com `trashed: true`.
   * Usada pelo worker de importação CSV para resolver display values de campos
   * RELATIONSHIP de volta para ObjectIds.
   */
  abstract findManyByFieldValues(
    table: RowTableContext,
    fieldSlugs: string[],
    values: string[],
  ): Promise<IRow[]>;

  // ── Category cleanup (delete-category) ────────────────────

  /**
   * Remove os `ids` (categorias) do array `fieldSlug` de todas as rows que os
   * contenham. Usada ao excluir uma seção (categoria) para desvincular os
   * registros (artigos) sem apagá-los.
   * Retorna a quantidade de rows modificadas.
   */
  abstract pullCategoryValues(
    table: RowTableContext,
    fieldSlug: string,
    ids: string[],
  ): Promise<number>;

  // ── Relationship FK (cascade/SET_NULL) ────────────────────

  /**
   * Zera (`null`) o campo `fieldSlug` em todas as rows cujo valor seja `value`.
   * Usada no SET_NULL de relacionamento FK (1:1/1:N): orfana os filhos que
   * apontavam para o pai removido. Retorna a quantidade de rows modificadas.
   */
  abstract clearFieldValue(
    table: RowTableContext,
    fieldSlug: string,
    value: string,
  ): Promise<number>;
}
