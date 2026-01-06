/* eslint-disable no-unused-vars */
import type { E_MENU_ITEM_TYPE, Menu } from '@application/core/entity.core';

export interface MenuCreatePayload {
  name: string;
  slug: string;
  type: keyof typeof E_MENU_ITEM_TYPE;
  table?: string | null;
  parent?: string | null;
  url?: string | null;
  html?: string | null;
}

export interface MenuFindByPayload {
  _id?: string;
  slug?: string;
  parent?: string | null;
  trashed?: boolean;
  exact?: boolean;
}

export interface MenuQueryPayload {
  page?: number;
  perPage?: number;
  search?: string;
  trashed?: boolean;
  parent?: string | null;
  _id?: string;
}

export interface MenuUpdatePayload {
  _id: string;
  name?: string;
  slug?: string;
  type?: keyof typeof E_MENU_ITEM_TYPE;
  table?: string | null;
  parent?: string | null;
  url?: string | null;
  html?: string | null;
}

export abstract class MenuContractRepository {
  abstract create(payload: MenuCreatePayload): Promise<Menu>;
  abstract findBy(payload: MenuFindByPayload): Promise<Menu | null>;
  abstract findMany(payload?: MenuQueryPayload): Promise<Menu[]>;
  abstract update(payload: MenuUpdatePayload): Promise<Menu>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: MenuQueryPayload): Promise<number>;
}
