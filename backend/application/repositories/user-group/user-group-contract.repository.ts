/* eslint-disable no-unused-vars */
import type { IGroup } from '@application/core/entity.core';

export interface UserGroupCreatePayload {
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
}

export interface UserGroupFindByPayload {
  _id?: string;
  slug?: string;
  exact?: boolean;
}

export interface UserGroupQueryPayload {
  page?: number;
  perPage?: number;
  search?: string;
  _id?: string;
}

export interface UserGroupUpdatePayload {
  _id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  permissions?: string[];
}

export abstract class UserGroupContractRepository {
  abstract create(payload: UserGroupCreatePayload): Promise<IGroup>;
  abstract findBy(payload: UserGroupFindByPayload): Promise<IGroup | null>;
  abstract findMany(payload?: UserGroupQueryPayload): Promise<IGroup[]>;
  abstract update(payload: UserGroupUpdatePayload): Promise<IGroup>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserGroupQueryPayload): Promise<number>;
}
