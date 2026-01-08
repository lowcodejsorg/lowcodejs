/* eslint-disable no-unused-vars */
import type { IStorage, Merge } from '@application/core/entity.core';

export type StorageCreatePayload = Pick<
  IStorage,
  'url' | 'filename' | 'type' | 'originalName' | 'size'
>;

export type StorageUpdatePayload = Merge<
  Pick<IStorage, '_id'>,
  Partial<StorageCreatePayload>
>;

export type StorageFindByPayload = Merge<
  Partial<Pick<IStorage, '_id' | 'filename'>>,
  { exact: boolean }
>;

export type StorageQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  type?: string;
};

export abstract class StorageContractRepository {
  abstract create(payload: StorageCreatePayload): Promise<IStorage>;
  abstract createMany(payload: StorageCreatePayload[]): Promise<IStorage[]>;
  abstract findBy(payload: StorageFindByPayload): Promise<IStorage | null>;
  abstract findMany(payload?: StorageQueryPayload): Promise<IStorage[]>;
  abstract update(payload: StorageUpdatePayload): Promise<IStorage>;
  abstract delete(_id: string): Promise<IStorage | null>;
  abstract count(payload?: StorageQueryPayload): Promise<number>;
}
