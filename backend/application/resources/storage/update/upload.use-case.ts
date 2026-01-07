import type { MultipartFile } from '@fastify/multipart';
import { getInstanceByToken, Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IStorage as Entity,
  Optional,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Storage as Model } from '@application/model/storage.model';
import StorageService from '@application/services/storage.service';
type Response = Either<HTTPException, Entity[]>;

type Sended = Optional<
  Entity,
  '_id' | 'createdAt' | 'updatedAt' | 'trashedAt' | 'trashed'
>;

@Service()
export default class StorageUploadUseCase {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly service: StorageService = getInstanceByToken(
      StorageService,
    ),
  ) {}

  async execute(
    payload: AsyncIterableIterator<MultipartFile>,
  ): Promise<Response> {
    try {
      const data: Sended[] = [];

      for await (const part of payload) {
        const sended = await this.service.upload(part);
        data.push(sended);
      }

      const storages = await Model.insertMany(data);

      return right(
        storages.map((storage) => ({
          ...storage.toJSON({
            flattenObjectIds: true,
          }),
          _id: storage._id.toString(),
        })),
      );
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'STORAGE_UPLOAD_ERROR',
        ),
      );
    }
  }
}
