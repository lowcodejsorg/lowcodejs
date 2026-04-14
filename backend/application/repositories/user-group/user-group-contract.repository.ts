/* eslint-disable no-unused-vars */
import type {
  FindOptions,
  IGroup,
  ISystemPermissions,
  IUser,
  Merge,
} from '@application/core/entity.core';

export type UserGroupCreatePayload = Merge<
  Pick<IGroup, 'name' | 'slug'>,
  {
    description?: string | null;
    permissions: string[];
    encompasses?: string[];
    systemPermissions?: Partial<ISystemPermissions>;
    immutable?: boolean;
  }
>;

export type UserGroupUpdatePayload = Merge<
  Pick<IGroup, '_id'>,
  Partial<UserGroupCreatePayload>
>;

export type UserGroupQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  user?: Pick<IUser, '_id'>;
  sort?: Record<string, 'asc' | 'desc'>;
};

export abstract class UserGroupContractRepository {
  abstract create(payload: UserGroupCreatePayload): Promise<IGroup>;
  abstract findById(_id: string, options?: FindOptions): Promise<IGroup | null>;
  abstract findBySlug(
    slug: string,
    options?: FindOptions,
  ): Promise<IGroup | null>;
  abstract findMany(payload?: UserGroupQueryPayload): Promise<IGroup[]>;
  abstract update(payload: UserGroupUpdatePayload): Promise<IGroup>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserGroupQueryPayload): Promise<number>;
}
