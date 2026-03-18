import type { IMenu } from '@application/core/entity.core';

import type {
  MenuContractRepository,
  MenuCreatePayload,
  MenuFindByPayload,
  MenuQueryPayload,
  MenuUpdatePayload,
} from './menu-contract.repository';

export default class MenuInMemoryRepository implements MenuContractRepository {
  private items: IMenu[] = [];

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

  async findBy({
    _id,
    slug,
    parent,
    trashed,
    exact = false,
  }: MenuFindByPayload): Promise<IMenu | null> {
    const menu = this.items.find((m) => {
      if (exact) {
        return (
          (_id ? m._id === _id : true) &&
          (slug ? m.slug === slug : true) &&
          (parent !== undefined ? m.parent === parent : true) &&
          (trashed !== undefined ? m.trashed === trashed : true)
        );
      }
      return (
        (m._id === _id || m.slug === slug || m.parent === parent) &&
        (trashed !== undefined ? m.trashed === trashed : true)
      );
    });

    return menu ?? null;
  }

  async findMany(payload?: MenuQueryPayload): Promise<IMenu[]> {
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
    const menu = this.items.find((m) => m._id === _id);
    if (!menu) throw new Error('Menu not found');
    Object.assign(menu, payload, { updatedAt: new Date() });
    return menu;
  }

  async delete(_id: string): Promise<void> {
    const index = this.items.findIndex((m) => m._id === _id);
    if (index === -1) throw new Error('Menu not found');
    this.items.splice(index, 1);
  }

  async count(payload?: MenuQueryPayload): Promise<number> {
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
