/* eslint-disable no-unused-vars */
import type { IPermission, Merge } from '@application/core/entity.core';

export type PermissionCreatePayload = Pick<
  IPermission,
  'name' | 'slug' | 'description'
>;

export type PermissionUpdatePayload = Merge<
  Pick<IPermission, '_id'>,
  Partial<PermissionCreatePayload>
>;

export type PermissionFindByPayload = Merge<
  Partial<Pick<IPermission, '_id' | 'slug'>>,
  { exact: boolean }
>;

export type PermissionQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
};

export abstract class PermissionContractRepository {
  abstract create(payload: PermissionCreatePayload): Promise<IPermission>;
  abstract findBy(
    payload: PermissionFindByPayload,
  ): Promise<IPermission | null>;
  abstract findMany(payload?: PermissionQueryPayload): Promise<IPermission[]>;
  abstract update(payload: PermissionUpdatePayload): Promise<IPermission>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: PermissionQueryPayload): Promise<number>;
}
