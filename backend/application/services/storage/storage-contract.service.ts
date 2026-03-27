/* eslint-disable no-unused-vars */
import type { MultipartFile } from '@fastify/multipart';
import { Service } from 'fastify-decorators';

import type { IStorage, Optional } from '@application/core/entity.core';

export type StorageUploadResponse = Optional<
  IStorage,
  '_id' | 'url' | 'createdAt' | 'updatedAt' | 'trashedAt' | 'trashed'
>;

@Service()
export abstract class StorageContractService {
  abstract upload(
    part: MultipartFile,
    staticName?: string,
  ): Promise<StorageUploadResponse>;
  abstract delete(filename: string): Promise<boolean>;
  abstract exists(filename: string): Promise<boolean>;
}
