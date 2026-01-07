/* eslint-disable no-unused-vars */
import type { E_ROLE, IUser } from '@application/core/entity.core';

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  group: string;
}

export interface UserFindByPayload {
  _id?: string;
  email?: string;
  exact?: boolean;
}

export interface UserQueryPayload {
  page?: number;
  perPage?: number;
  search?: string;
  // _id?: string;
  user?: {
    _id: string;
    role: keyof typeof E_ROLE;
  };
}

export interface UserUpdatePayload {
  _id: string;
  name?: string;
  email?: string;
  password?: string;
  status?: 'active' | 'inactive';
  group?: string;
}

export abstract class UserContractRepository {
  abstract create(payload: UserCreatePayload): Promise<IUser>;
  abstract findBy(payload: UserFindByPayload): Promise<IUser | null>;
  abstract findMany(payload?: UserQueryPayload): Promise<IUser[]>;
  abstract update(payload: UserUpdatePayload): Promise<IUser>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserQueryPayload): Promise<number>;
}
