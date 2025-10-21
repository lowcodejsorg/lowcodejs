/* eslint-disable no-unused-vars */
import type { MultipartFile } from '@fastify/multipart';
import { getInstanceByToken, Service } from 'fastify-decorators';

import type { Either } from '@core/either.core';
import { left, right } from '@core/either.core';
import type { Storage as Entity, Optional } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { Storage as Model } from '@model/storage.model';
import StorageService from '@services/storage.service';
type Response = Either<ApplicationException, Entity[]>;

type Sended = Optional<
  Entity,
  '_id' | 'createdAt' | 'updatedAt' | 'trashedAt' | 'trashed'
>;

@Service()
export default class UploadStorageUseCase {
  constructor(
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
        ApplicationException.InternalServerError(
          'Internal server error',
          'STORAGE_UPLOAD_ERROR',
        ),
      );
    }
  }
}
