/* eslint-disable no-unused-vars */
import type {
  E_ROLE,
  IGroup,
  IUser,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

export type UserGroupCreatePayload = Merge<
  Pick<IGroup, 'name' | 'slug'>,
  {
    description?: string | null;
    permissions: string[];
  }
>;

export type UserGroupUpdatePayload = Merge<
  Pick<IGroup, '_id'>,
  Partial<UserGroupCreatePayload>
>;

export type UserGroupFindByPayload = Merge<
  Partial<Pick<IGroup, '_id' | 'slug'>>,
  { exact: boolean }
>;

export type UserGroupQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  user?: Merge<Pick<IUser, '_id'>, { role: ValueOf<typeof E_ROLE> }>;
};

export abstract class UserGroupContractRepository {
  abstract create(payload: UserGroupCreatePayload): Promise<IGroup>;
  abstract findBy(payload: UserGroupFindByPayload): Promise<IGroup | null>;
  abstract findMany(payload?: UserGroupQueryPayload): Promise<IGroup[]>;
  abstract update(payload: UserGroupUpdatePayload): Promise<IGroup>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserGroupQueryPayload): Promise<number>;
}
