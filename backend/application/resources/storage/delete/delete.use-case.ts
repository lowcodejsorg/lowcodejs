import { getInstanceByToken, Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { Storage as Model } from '@application/model/storage.model';
import StorageService from '@application/services/storage.service';

type Response = Either<HTTPException, null>;

@Service()
export default class StorageDeleteUseCase {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly service: StorageService = getInstanceByToken(
      StorageService,
    ),
  ) {}

  async execute({ _id }: { _id: string }): Promise<Response> {
    try {
      const storage = await Model.findByIdAndDelete({ _id });

      if (!storage) {
        return left(
          HTTPException.NotFound('Storage not found', 'STORAGE_NOT_FOUND'),
        );
      }

      await this.service.delete(storage.filename);

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'STORAGE_DELETE_ERROR',
        ),
      );
    }
  }
}
