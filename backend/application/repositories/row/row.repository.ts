/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { IField, IRow } from '@application/core/entity.core';
import { ModelBuilderContractService } from '@application/services/table/model-builder-contract.service';
import { PopulateBuilderContractService } from '@application/services/table/populate-builder-contract.service';
import { QueryBuilderContractService } from '@application/services/table/query-builder-contract.service';
import { RelationshipBuilderContractService } from '@application/services/table/relationship-builder-contract.service';
import type { RelationshipHydratableDoc } from '@application/services/table/relationship-builder-contract.service';
import { getDataConnection } from '@config/database.config';

interface SubdocArray<T = unknown> extends Array<T> {
  id(
    itemId: string,
  ): (T & { set(d: Record<string, unknown>): void; deleteOne(): void }) | null;
}

import type {
  RowBulkDeletePayload,
  RowBulkUpdatePayload,
  RowCreatePayload,
  RowFindManyPayload,
  RowFindOnePayload,
  RowGroupItemPayload,
  RowSetFieldPayload,
  RowTableContext,
  RowUpdatePayload,
} from './row-contract.repository';
import { RowContractRepository } from './row-contract.repository';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSubdocArray(value: unknown): value is SubdocArray {
  if (!Array.isArray(value)) return false;
  // Mongoose 8 envolve document arrays em Proxy: `'id' in value` retorna false
  // mesmo com o metodo presente. Reflect.get dispara o get trap do Proxy.
  return typeof Reflect.get(value, 'id') === 'function';
}

interface MongooseDocWithToJSON {
  toJSON(opts: { flattenObjectIds: boolean }): Record<string, unknown>;
  _id: { toString(): string };
}

function hasToJSON(value: unknown): value is MongooseDocWithToJSON {
  return isRecord(value) && typeof value['toJSON'] === 'function';
}

function assertIRow(value: Record<string, unknown>): asserts value is IRow {
  if (typeof value['_id'] !== 'string') {
    throw new Error('Invalid row: _id must be string');
  }
}

@Service()
export default class RowMongooseRepository implements RowContractRepository {
  constructor(
    private readonly model: ModelBuilderContractService,
    private readonly query: QueryBuilderContractService,
    private readonly populate: PopulateBuilderContractService,
    private readonly relationship: RelationshipBuilderContractService,
  ) {}

  // Hidrata os paths RELATIONSHIP geridos por links nos docs antes do populate,
  // para que o populate padrao resolva como no modelo embedded legado.
  private async hydrateRelationships(
    fields: IField[],
    docs: RelationshipHydratableDoc[],
  ): Promise<void> {
    await this.relationship.hydrate(fields, docs);
  }

  private async getModel(
    table: RowTableContext,
  ): ReturnType<ModelBuilderContractService['build']> {
    return this.model.build(table);
  }

  private async getPopulate(
    table: RowTableContext,
  ): ReturnType<PopulateBuilderContractService['build']> {
    return this.populate.build(table.fields, table.groups, getDataConnection());
  }

  private transformRow(doc: unknown): IRow {
    let json: Record<string, unknown>;

    if (hasToJSON(doc)) {
      json = doc.toJSON({ flattenObjectIds: true });
    } else if (isRecord(doc)) {
      json = { ...doc };
    } else {
      json = {};
    }

    let id = '';
    if (isRecord(doc) && doc['_id']) {
      id = String(doc['_id']);
    }

    json['_id'] = id;
    assertIRow(json);
    return json;
  }

  // ── Core CRUD ─────────────────────────────────────────────

  async create(payload: RowCreatePayload): Promise<IRow> {
    const model = await this.getModel(payload.table);
    const populate = await this.getPopulate(payload.table);

    const fields = payload.table.fields ?? [];
    const { data, pending } = this.relationship.extract(fields, payload.data);

    const created = await model.create(data);

    // Fallback compensatorio (Mongo standalone, sem transacao): persiste os
    // links apos a row; em falha de cardinalidade, desfaz a row e propaga.
    try {
      await this.relationship.persist(fields, created._id.toString(), pending);
    } catch (error) {
      await model.findOneAndDelete({ _id: created._id });
      throw error;
    }

    await this.hydrateRelationships(fields, [created]);
    const populated = await created.populate(populate);

    return this.transformRow(populated);
  }

  async findOne(payload: RowFindOnePayload): Promise<IRow | null> {
    const model = await this.getModel(payload.table);
    const row = await model.findOne(payload.query);

    if (!row) return null;

    const shouldPopulate = payload.populate !== false;
    if (shouldPopulate) {
      const populate = await this.getPopulate(payload.table);
      await this.hydrateRelationships(payload.table.fields ?? [], [row]);
      await row.populate(populate);
    }

    return this.transformRow(row);
  }

  async findMany(payload: RowFindManyPayload): Promise<IRow[]> {
    const model = await this.getModel(payload.table);
    const populate = await this.getPopulate(payload.table);

    const conn = getDataConnection();
    const query = await this.query.build(
      payload.rawFilters ?? {},
      payload.table.fields ?? [],
      payload.table.groups,
      payload.table.slug,
      conn,
    );

    const sort = this.query.order(
      payload.rawFilters ?? {},
      payload.table.fields ?? [],
      payload.table.order,
    );

    const rows = await model
      .find(query)
      .skip(payload.skip)
      .limit(payload.limit)
      .sort(sort);

    await this.hydrateRelationships(payload.table.fields ?? [], rows);
    await model.populate(rows, populate);

    return rows.map((row) => this.transformRow(row));
  }

  async count(
    table: RowTableContext,
    rawFilters?: Record<string, unknown>,
  ): Promise<number> {
    const model = await this.getModel(table);
    const query = await this.query.build(
      rawFilters ?? {},
      table.fields ?? [],
      table.groups,
      table.slug,
      getDataConnection(),
    );
    return model.countDocuments(query);
  }

  async update(payload: RowUpdatePayload): Promise<IRow> {
    const model = await this.getModel(payload.table);
    const populate = await this.getPopulate(payload.table);

    const fields = payload.table.fields ?? [];
    const { data, pending } = this.relationship.extract(fields, payload.data);

    // Links primeiro: reconcilia (e valida cardinalidade) antes de tocar a row,
    // evitando atualizacao parcial em caso de violacao.
    await this.relationship.persist(fields, payload._id, pending);

    const row = await model.findOneAndUpdate(
      { _id: payload._id },
      { $set: data },
      { new: true },
    );
    if (!row) throw new Error('Row not found');

    await this.hydrateRelationships(fields, [row]);
    await row.populate(populate);

    return this.transformRow(row);
  }

  async deleteOne(table: RowTableContext, _id: string): Promise<boolean> {
    const model = await this.getModel(table);
    const result = await model.findOneAndDelete({ _id });
    return result !== null;
  }

  async listSlugs(
    table: RowTableContext,
    excludeId?: string,
  ): Promise<string[]> {
    const model = await this.getModel(table);

    const filter: Record<string, unknown> = {};
    if (excludeId) filter._id = { $ne: excludeId };

    const slugs = await model.distinct('sharedRowSlug', filter);

    return slugs.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
  }

  // ── Trash (bulk) ──────────────────────────────────────────

  async bulkTrash(payload: RowBulkUpdatePayload): Promise<number> {
    const model = await this.getModel(payload.table);
    const result = await model.updateMany(
      {
        _id: { $in: payload.ids },
        trashedAt: null,
        ...(payload.creatorId && { creator: payload.creatorId }),
      },
      { $set: { trashedAt: new Date() } },
    );
    return result.modifiedCount;
  }

  async bulkRestore(payload: RowBulkUpdatePayload): Promise<number> {
    const model = await this.getModel(payload.table);
    const result = await model.updateMany(
      {
        _id: { $in: payload.ids },
        trashedAt: { $ne: null },
        ...(payload.creatorId && { creator: payload.creatorId }),
      },
      { $set: { trashedAt: null } },
    );
    return result.modifiedCount;
  }

  async bulkDelete(payload: RowBulkDeletePayload): Promise<number> {
    const model = await this.getModel(payload.table);
    const result = await model.deleteMany({
      _id: { $in: payload.ids },
      trashedAt: { $ne: null },
      ...(payload.creatorId && { creator: payload.creatorId }),
    });
    return result.deletedCount;
  }

  async emptyTrash(
    table: RowTableContext,
    creatorId?: string,
  ): Promise<number> {
    const model = await this.getModel(table);
    const result = await model.deleteMany({
      trashedAt: { $ne: null },
      ...(creatorId && { creator: creatorId }),
    });
    return result.deletedCount;
  }

  // ── Field-level (reaction / evaluation) ───────────────────

  async setFieldAndSave(payload: RowSetFieldPayload): Promise<IRow> {
    const model = await this.getModel(payload.table);
    const populate = await this.getPopulate(payload.table);

    // Update atomico do unico campo (reaction/evaluation): findOneAndUpdate nao
    // roda validators por padrao, evitando revalidar campos required nao
    // relacionados que estejam null em rows legadas/draft (full-doc .save()
    // quebrava com "Path X is required").
    const row = await model.findOneAndUpdate(
      { _id: payload._id },
      { $set: { [payload.field]: payload.value } },
      { new: true },
    );
    if (!row) throw new Error('Row not found');

    await this.hydrateRelationships(payload.table.fields ?? [], [row]);
    await row.populate(populate);

    return this.transformRow(row);
  }

  // ── Group rows (subdocumentos) ────────────────────────────

  async addGroupItem(
    payload: RowGroupItemPayload & { data: Record<string, unknown> },
  ): Promise<IRow> {
    const model = await this.getModel(payload.table);
    const populate = await this.getPopulate(payload.table);

    const row = await model.findOne({ _id: payload.rowId });
    if (!row) throw new Error('Row not found');

    const currentItems = row.get(payload.groupFieldSlug);
    const groupData = Array.isArray(currentItems) ? [...currentItems] : [];
    groupData.push(payload.data);

    row.set(payload.groupFieldSlug, groupData);
    await row.save();
    await this.hydrateRelationships(payload.table.fields ?? [], [row]);
    await row.populate(populate);

    return this.transformRow(row);
  }

  async updateGroupItem(
    payload: RowGroupItemPayload & {
      itemId: string;
      data: Record<string, unknown>;
    },
  ): Promise<IRow> {
    const model = await this.getModel(payload.table);
    const populate = await this.getPopulate(payload.table);

    const row = await model.findOne({ _id: payload.rowId });
    if (!row) throw new Error('Row not found');

    const subdocArray = row.get(payload.groupFieldSlug);

    if (!isSubdocArray(subdocArray)) {
      throw new Error('Group field not found');
    }

    const subdoc = subdocArray.id(payload.itemId);
    if (!subdoc) throw new Error('Item not found');

    subdoc.set(payload.data);
    await row.save();
    await this.hydrateRelationships(payload.table.fields ?? [], [row]);
    await row.populate(populate);

    return this.transformRow(row);
  }

  async deleteGroupItem(
    payload: RowGroupItemPayload & { itemId: string },
  ): Promise<boolean> {
    const model = await this.getModel(payload.table);

    const row = await model.findOne({ _id: payload.rowId });
    if (!row) return false;

    const subdocArray = row.get(payload.groupFieldSlug);
    if (!isSubdocArray(subdocArray)) return false;

    const subdoc = subdocArray.id(payload.itemId);
    if (!subdoc) return false;

    subdoc.deleteOne();
    await row.save();

    return true;
  }

  // ── Atomic update (forum-message) ─────────────────────────

  async findOneAndUpdate(
    table: RowTableContext,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<IRow | null> {
    const model = await this.getModel(table);
    const populate = await this.getPopulate(table);

    const row = await model.findOneAndUpdate(filter, update, { new: true });
    if (!row) return null;

    await this.hydrateRelationships(table.fields ?? [], [row]);
    await row.populate(populate);

    return this.transformRow(row);
  }

  // ── Infrastructure-level ops (table/import/export tools) ──

  async renameField(
    table: RowTableContext,
    oldSlug: string,
    newSlug: string,
  ): Promise<void> {
    const model = await this.getModel(table);
    await model.updateMany({}, { $rename: { [oldSlug]: newSlug } });
  }

  async findAllRaw(table: RowTableContext): Promise<Record<string, unknown>[]> {
    const model = await this.getModel(table);
    const docs = await model.find({ trashedAt: null }).lean();
    return docs.map((doc): Record<string, unknown> => ({ ...doc }));
  }

  async insertRaw(
    table: RowTableContext,
    row: Record<string, unknown>,
    creator?: string,
  ): Promise<IRow> {
    const model = await this.getModel(table);
    const { _id, id, createdAt, updatedAt, ...data } = row;
    const doc = new model(data);
    if (creator) {
      (doc as any).creator = creator;
    }
    const result = await doc.collection.insertOne((doc as any).toObject());
    return {
      ...(doc as any).toObject(),
      _id: result.insertedId.toString(),
    } as IRow;
  }

  // ── Resolver helpers (csv-import) ─────────────────────────

  async findManyByFieldValues(
    table: RowTableContext,
    fieldSlugs: string[],
    values: string[],
  ): Promise<IRow[]> {
    if (fieldSlugs.length === 0 || values.length === 0) return [];

    const model = await this.getModel(table);
    const orClauses = fieldSlugs.map((slug) => ({
      [slug]: { $in: values },
    }));

    const docs = await model.find({ $or: orClauses, trashedAt: null }).lean();

    return docs.map((doc) => this.transformRow(doc));
  }

  // ── Category cleanup (delete-category) ────────────────────

  async pullCategoryValues(
    table: RowTableContext,
    fieldSlug: string,
    ids: string[],
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const model = await this.getModel(table);
    const result = await model.updateMany(
      { [fieldSlug]: { $in: ids } },
      { $pull: { [fieldSlug]: { $in: ids } } },
    );

    return result.modifiedCount;
  }
}
