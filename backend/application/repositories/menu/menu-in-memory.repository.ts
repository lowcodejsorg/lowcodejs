import type { FindOptions, IMenu } from '@application/core/entity.core';

import type {
  MenuContractRepository,
  MenuCreatePayload,
  MenuQueryPayload,
  MenuUpdatePayload,
} from './menu-contract.repository';

export default class MenuInMemoryRepository implements MenuContractRepository {
  items: IMenu[] = [];
  private _forcedErrors = new Map<string, Error>();

  simulateError(method: string, error: Error): void {
    this._forcedErrors.set(method, error);
  }

  private _checkError(method: string): void {
    const err = this._forcedErrors.get(method);
    if (err) {
      this._forcedErrors.delete(method);
      throw err;
    }
  }

  async create(payload: MenuCreatePayload): Promise<IMenu> {
    const menu: IMenu = {
      ...payload,
      _id: crypto.randomUUID(),
      owner: payload.owner ?? null,
      table: payload.table ?? null,
      parent: payload.parent ?? null,
      url: payload.url ?? null,
      html: payload.html ?? null,
      order: payload.order ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(menu);
    return menu;
  }

  async findById(_id: string, options?: FindOptions): Promise<IMenu | null> {
    this._checkError('findById');
    const item = this.items.find((i) => {
      if (i._id !== _id) return false;
      if (options?.trashed !== undefined) return i.trashed === options.trashed;
      return true;
    });
    return item ?? null;
  }

  async findBySlug(slug: string, options?: FindOptions): Promise<IMenu | null> {
    this._checkError('findBySlug');
    const item = this.items.find((i) => {
      if (i.slug !== slug) return false;
      if (options?.trashed !== undefined) return i.trashed === options.trashed;
      return true;
    });
    return item ?? null;
  }

  async findMany(payload?: MenuQueryPayload): Promise<IMenu[]> {
    this._checkError('findMany');
    let filtered = this.items;

    const trashed = payload?.trashed ?? false;
    filtered = filtered.filter((m) => m.trashed === trashed);

    if (payload?.parent !== undefined) {
      filtered = filtered.filter((m) => m.parent === payload.parent);
    }

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.slug.toLowerCase().includes(search),
      );
    }

    filtered = filtered.sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: MenuUpdatePayload): Promise<IMenu> {
    this._checkError('update');
    const menu = this.items.find((m) => m._id === _id);
    if (!menu) throw new Error('Menu not found');
    Object.assign(menu, payload, { updatedAt: new Date() });
    return menu;
  }

  async delete(_id: string): Promise<void> {
    this._checkError('delete');
    const index = this.items.findIndex((m) => m._id === _id);
    if (index === -1) throw new Error('Menu not found');
    this.items.splice(index, 1);
  }

  async count(payload?: MenuQueryPayload): Promise<number> {
    this._checkError('count');
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }

  async findDescendantIds(menuId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [menuId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = this.items.filter((m) => m.parent === currentId);
      for (const child of children) {
        descendants.push(child._id);
        queue.push(child._id);
      }
    }

    return descendants;
  }
}
