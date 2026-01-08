/* eslint-disable no-unused-vars */
import type {
  E_ROLE,
  E_USER_STATUS,
  IUser,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

export type UserCreatePayload = Merge<
  Pick<IUser, 'name' | 'email' | 'password'>,
  { group: string; status?: ValueOf<typeof E_USER_STATUS> }
>;

export type UserUpdatePayload = Merge<
  Merge<Pick<IUser, '_id'>, Partial<UserCreatePayload>>,
  { group?: string; status?: ValueOf<typeof E_USER_STATUS> }
>;

export type UserFindByPayload = Merge<
  Partial<Pick<IUser, '_id' | 'email'>>,
  { exact: boolean }
>;

export type UserQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  user?: Merge<Pick<IUser, '_id'>, { role: ValueOf<typeof E_ROLE> }>;
  _ids?: string[];
  status?: ValueOf<typeof E_USER_STATUS>;
  trashed?: boolean;
};

export abstract class UserContractRepository {
  abstract create(payload: UserCreatePayload): Promise<IUser>;
  abstract findBy(payload: UserFindByPayload): Promise<IUser | null>;
  abstract findMany(payload?: UserQueryPayload): Promise<IUser[]>;
  abstract update(payload: UserUpdatePayload): Promise<IUser>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserQueryPayload): Promise<number>;
}
