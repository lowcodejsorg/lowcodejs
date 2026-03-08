import type {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  IField,
  IStorage,
  ITable,
  IUser,
} from '@application/core/entity.core';

import type {
  TableContractRepository,
  TableCreatePayload,
  TableFindByPayload,
  TableQueryPayload,
  TableUpdateManyPayload,
  TableUpdatePayload,
} from './table-contract.repository';

export default class TableInMemoryRepository implements TableContractRepository {
  private items: ITable[] = [];

  async create(payload: TableCreatePayload): Promise<ITable> {
    const table: ITable = {
      _id: crypto.randomUUID(),
      _schema: payload._schema ?? {},
      name: payload.name,
      description: payload.description ?? null,
      logo: payload.logo ? ({ _id: payload.logo } as IStorage) : null,
      slug: payload.slug,
      fields: (payload.fields ?? []).map(
        (f) => (typeof f === 'object' ? f : { _id: f }) as IField,
      ),
      type: payload.type ?? ('TABLE' as typeof E_TABLE_TYPE.TABLE),
      style: payload.style ?? ('LIST' as typeof E_TABLE_STYLE.LIST),
      visibility:
        payload.visibility ??
        ('RESTRICTED' as typeof E_TABLE_VISIBILITY.RESTRICTED),
      collaboration:
        payload.collaboration ??
        ('RESTRICTED' as typeof E_TABLE_COLLABORATION.RESTRICTED),
      administrators: (payload.administrators ?? []).map(
        (a) => ({ _id: a }) as IUser,
      ),
      owner: { _id: payload.owner } as IUser,
      fieldOrderList: payload.fieldOrderList ?? [],
      fieldOrderForm: payload.fieldOrderForm ?? [],
      methods: payload.methods ?? {
        onLoad: { code: null },
        beforeSave: { code: null },
        afterSave: { code: null },
      },
      groups: payload.groups ?? [],
      order: payload.order ?? null,
      layoutFields: payload.layoutFields ?? {
        title: null,
        description: null,
        cover: null,
        category: null,
        startDate: null,
        endDate: null,
        color: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(table);
    return table;
  }

  async findBy({
    _id,
    slug,
    exact = false,
  }: TableFindByPayload): Promise<ITable | null> {
    const table = this.items.find((t) => {
      if (exact) {
        return (_id ? t._id === _id : true) && (slug ? t.slug === slug : true);
      }
      return t._id === _id || t.slug === slug;
    });
    return table ?? null;
  }

  async findMany(payload?: TableQueryPayload): Promise<ITable[]> {
    let filtered = this.items;

    // Filtro de trashed
    if (payload?.trashed !== undefined) {
      filtered = filtered.filter((t) => t.trashed === payload.trashed);
    } else {
      filtered = filtered.filter((t) => !t.trashed);
    }

    // Filtro por múltiplos IDs
    if (payload?._ids && payload._ids.length > 0) {
      filtered = filtered.filter((t) => payload._ids!.includes(t._id));
    }

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(search));
    }

    if (payload?.type) {
      filtered = filtered.filter((t) => t.type === payload.type);
    }

    if (payload?.owner) {
      filtered = filtered.filter(
        (t) => (t.owner as IUser)?._id === payload.owner,
      );
    }

    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: TableUpdatePayload): Promise<ITable> {
    const table = this.items.find((t) => t._id === _id);
    if (!table) throw new Error('Table not found');

    if (payload.logo !== undefined) {
      table.logo = payload.logo ? ({ _id: payload.logo } as IStorage) : null;
    }
    if (payload.fields !== undefined) {
      table.fields = payload.fields.map((f) => ({ _id: f }) as IField);
    }
    if (payload.administrators !== undefined) {
      table.administrators = payload.administrators.map(
        (a) => ({ _id: a }) as IUser,
      );
    }
    if (payload.owner !== undefined) {
      table.owner = { _id: payload.owner } as IUser;
    }
    if (payload.style !== undefined) {
      table.style = payload.style;
    }
    if (payload.visibility !== undefined) {
      table.visibility = payload.visibility;
    }
    if (payload.collaboration !== undefined) {
      table.collaboration = payload.collaboration;
    }
    if (payload.fieldOrderList !== undefined) {
      table.fieldOrderList = payload.fieldOrderList;
    }
    if (payload.fieldOrderForm !== undefined) {
      table.fieldOrderForm = payload.fieldOrderForm;
    }
    if (payload.groups !== undefined) {
      table.groups = payload.groups;
    }
    if (payload.name !== undefined) table.name = payload.name;
    if (payload.description !== undefined)
      table.description = payload.description;
    if (payload.slug !== undefined) table.slug = payload.slug;
    if (payload.type !== undefined) table.type = payload.type;
    if (payload._schema !== undefined) table._schema = payload._schema;
    if (payload.methods !== undefined) table.methods = payload.methods;
    if (payload.trashed !== undefined) table.trashed = payload.trashed;
    if (payload.trashedAt !== undefined) table.trashedAt = payload.trashedAt;

    table.updatedAt = new Date();
    return table;
  }

  async updateMany({
    _ids,
    type,
    data,
  }: TableUpdateManyPayload): Promise<void> {
    let filtered = this.items.filter((t) => _ids.includes(t._id));

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    for (const table of filtered) {
      if (data.visibility) table.visibility = data.visibility;
      if (data.style) table.style = data.style;
      if (data.collaboration) table.collaboration = data.collaboration;
      table.updatedAt = new Date();
    }
  }

  async delete(_id: string): Promise<void> {
    const index = this.items.findIndex((t) => t._id === _id);
    if (index === -1) throw new Error('Table not found');
    this.items.splice(index, 1);
  }

  async count(payload?: TableQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
