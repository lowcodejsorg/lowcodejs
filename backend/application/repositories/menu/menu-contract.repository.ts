/* eslint-disable no-unused-vars */
import type { FindOptions, IMenu, Merge } from '@application/core/entity.core';

export type MenuCreatePayload = Merge<
  Pick<IMenu, 'name' | 'slug' | 'type'>,
  Partial<
    Pick<
      IMenu,
      'table' | 'parent' | 'url' | 'html' | 'owner' | 'order' | 'visibility'
    >
  >
>;

export type MenuUpdatePayload = Merge<
  Pick<IMenu, '_id'>,
  Partial<MenuCreatePayload> & {
    trashed?: boolean;
    trashedAt?: Date | null;
  }
>;

export type MenuQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  trashed?: boolean;
  parent?: string | null;
  sort?: Record<string, 'asc' | 'desc'>;
};

export abstract class MenuContractRepository {
  abstract create(payload: MenuCreatePayload): Promise<IMenu>;
  abstract findById(_id: string, options?: FindOptions): Promise<IMenu | null>;
  abstract findBySlug(
    slug: string,
    options?: FindOptions,
  ): Promise<IMenu | null>;
  abstract findMany(payload?: MenuQueryPayload): Promise<IMenu[]>;
  abstract update(payload: MenuUpdatePayload): Promise<IMenu>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: MenuQueryPayload): Promise<number>;
  abstract findDescendantIds(menuId: string): Promise<string[]>;
}
