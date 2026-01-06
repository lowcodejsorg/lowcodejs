import type { Menu } from '@application/core/entity.core';

import type {
  MenuContractRepository,
  MenuCreatePayload,
  MenuFindByPayload,
  MenuQueryPayload,
  MenuUpdatePayload,
} from './menu-contract.repository';

export default class MenuInMemoryRepository implements MenuContractRepository {
  private items: Menu[] = [];

  async create(payload: MenuCreatePayload): Promise<Menu> {
    const menu: Menu = {
      ...payload,
      _id: crypto.randomUUID(),
      table: payload.table ?? null,
      parent: payload.parent ?? null,
      url: payload.url ?? null,
      html: payload.html ?? null,
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
    trashed = false,
    exact = false,
  }: MenuFindByPayload): Promise<Menu | null> {
    const menu = this.items.find((m) => {
      if (exact) {
        return (
          (_id ? m._id === _id : true) &&
          (slug ? m.slug === slug : true) &&
          (parent !== undefined ? m.parent === parent : true) &&
          m.trashed === trashed
        );
      }
      return (
        (m._id === _id || m.slug === slug || m.parent === parent) &&
        m.trashed === trashed
      );
    });

    return menu ?? null;
  }

  async findMany(payload?: MenuQueryPayload): Promise<Menu[]> {
    let filtered = this.items;

    if (payload?._id) {
      filtered = filtered.filter((m) => m._id !== payload._id);
    }

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

    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: MenuUpdatePayload): Promise<Menu> {
    const menu = this.items.find((m) => m._id === _id);
    if (!menu) throw new Error('Menu not found');
    Object.assign(menu, payload, { updatedAt: new Date() });
    return menu;
  }

  async delete(_id: string): Promise<void> {
    const menu = this.items.find((m) => m._id === _id);
    if (!menu) throw new Error('Menu not found');
    Object.assign(menu, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: MenuQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
