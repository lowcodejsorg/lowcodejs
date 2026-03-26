import type { IField } from '@application/core/entity.core';

import type {
  FieldContractRepository,
  FieldCreatePayload,
  FieldFindByPayload,
  FieldQueryPayload,
  FieldUpdatePayload,
} from './field-contract.repository';

export default class FieldInMemoryRepository implements FieldContractRepository {
  private items: IField[] = [];

  async create(payload: FieldCreatePayload): Promise<IField> {
    const field: IField = {
      ...payload,
      _id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(field);
    return field;
  }

  async createMany(payloads: FieldCreatePayload[]): Promise<IField[]> {
    const fields = payloads.map((payload) => ({
      ...payload,
      _id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    }));
    this.items.push(...fields);
    return fields;
  }

  async findBy({
    _id,
    slug,
    exact = false,
  }: FieldFindByPayload): Promise<IField | null> {
    const field = this.items.find((f) => {
      if (exact) {
        return (_id ? f._id === _id : true) && (slug ? f.slug === slug : true);
      }
      return f._id === _id || f.slug === slug;
    });
    return field ?? null;
  }

  async findMany(payload?: FieldQueryPayload): Promise<IField[]> {
    let filtered = this.items;

    if (payload?._ids && payload._ids.length > 0) {
      filtered = filtered.filter((f) => payload._ids!.includes(f._id));
    }

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(search));
    }

    if (payload?.type) {
      filtered = filtered.filter((f) => f.type === payload.type);
    }

    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: FieldUpdatePayload): Promise<IField> {
    const field = this.items.find((f) => f._id === _id);
    if (!field) throw new Error('Field not found');
    Object.assign(field, payload, { updatedAt: new Date() });
    return field;
  }

  async delete(_id: string): Promise<void> {
    await this.update({ _id, trashed: true, trashedAt: new Date() });
  }

  async deleteMany(_ids: string[]): Promise<void> {
    this.items = this.items.filter((f) => !_ids.includes(f._id));
  }

  async count(payload?: FieldQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }

  async updateRelationshipTableSlug(
    oldSlug: string,
    newSlug: string,
  ): Promise<void> {
    for (const field of this.items) {
      if (field.relationship?.table?.slug === oldSlug) {
        field.relationship.table.slug = newSlug;
      }
    }
  }

  async findByRelationshipTableId(tableId: string): Promise<IField[]> {
    return this.items.filter(
      (f) => !f.trashed && f.relationship?.table?._id === tableId,
    );
  }
}
