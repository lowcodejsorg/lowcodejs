/* eslint-disable no-unused-vars */
import type {
  E_USER_STATUS,
  FindOptions,
  IUser,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

export type UserCreatePayload = Merge<
  Pick<IUser, 'name' | 'email' | 'password'>,
  { groups: string[]; status?: ValueOf<typeof E_USER_STATUS> }
>;

export type UserUpdatePayload = Merge<
  Merge<Pick<IUser, '_id'>, Partial<UserCreatePayload>>,
  { groups?: string[]; status?: ValueOf<typeof E_USER_STATUS> }
>;

export type UserQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  user?: Pick<IUser, '_id'>;
  _ids?: string[];
  status?: ValueOf<typeof E_USER_STATUS>;
  trashed?: boolean;
  sort?: Record<string, 'asc' | 'desc'>;
};

export abstract class UserContractRepository {
  abstract create(payload: UserCreatePayload): Promise<IUser>;
  abstract findById(_id: string, options?: FindOptions): Promise<IUser | null>;
  abstract findByEmail(
    email: string,
    options?: FindOptions,
  ): Promise<IUser | null>;
  abstract findMany(payload?: UserQueryPayload): Promise<IUser[]>;
  abstract update(payload: UserUpdatePayload): Promise<IUser>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserQueryPayload): Promise<number>;
}
