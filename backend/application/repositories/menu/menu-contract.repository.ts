/* eslint-disable no-unused-vars */
import type { IMenu, Merge } from '@application/core/entity.core';

export type MenuCreatePayload = Merge<
  Pick<IMenu, 'name' | 'slug' | 'type'>,
  Partial<Pick<IMenu, 'table' | 'parent' | 'url' | 'html'>>
>;

export type MenuUpdatePayload = Merge<
  Pick<IMenu, '_id'>,
  Partial<MenuCreatePayload>
>;

export type MenuFindByPayload = Merge<
  Partial<Pick<IMenu, '_id' | 'slug' | 'parent'>>,
  { trashed?: boolean; exact: boolean }
>;

export type MenuQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  trashed?: boolean;
  parent?: string | null;
};

export abstract class MenuContractRepository {
  abstract create(payload: MenuCreatePayload): Promise<IMenu>;
  abstract findBy(payload: MenuFindByPayload): Promise<IMenu | null>;
  abstract findMany(payload?: MenuQueryPayload): Promise<IMenu[]>;
  abstract update(payload: MenuUpdatePayload): Promise<IMenu>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: MenuQueryPayload): Promise<number>;
}
