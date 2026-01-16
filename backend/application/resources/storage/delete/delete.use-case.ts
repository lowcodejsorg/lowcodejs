/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { StorageContractRepository } from '@application/repositories/storage/storage-contract.repository';
import StorageService from '@application/services/storage.service';

type Response = Either<HTTPException, null>;

@Service()
export default class StorageDeleteUseCase {
  constructor(
    private readonly storageRepository: StorageContractRepository,
    private readonly service: StorageService,
  ) {}

  async execute({ _id }: { _id: string }): Promise<Response> {
    try {
      const storage = await this.storageRepository.delete(_id);

      if (!storage) {
        return left(
          HTTPException.NotFound('Storage not found', 'STORAGE_NOT_FOUND'),
        );
      }

      await this.service.delete(storage.filename);

      return right(null);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'STORAGE_DELETE_ERROR',
        ),
      );
    }
  }
}
