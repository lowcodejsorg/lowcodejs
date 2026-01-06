/* eslint-disable no-unused-vars */
import type { User } from '@application/core/entity.core';

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
  _id?: string;
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
  abstract create(payload: UserCreatePayload): Promise<User>;
  abstract findBy(payload: UserFindByPayload): Promise<User | null>;
  abstract findMany(payload?: UserQueryPayload): Promise<User[]>;
  abstract update(payload: UserUpdatePayload): Promise<User>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: UserQueryPayload): Promise<number>;
}
