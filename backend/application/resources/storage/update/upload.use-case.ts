/* eslint-disable no-unused-vars */
import type { MultipartFile } from '@fastify/multipart';
import { getInstanceByToken, Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IStorage as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  StorageContractRepository,
  type StorageCreatePayload,
} from '@application/repositories/storage/storage-contract.repository';
import StorageService from '@application/services/storage.service';

type Response = Either<HTTPException, Entity[]>;

@Service()
export default class StorageUploadUseCase {
  constructor(
    private readonly storageRepository: StorageContractRepository,
    private readonly service: StorageService = getInstanceByToken(
      StorageService,
    ),
  ) {}

  async execute(
    payload: AsyncIterableIterator<MultipartFile>,
  ): Promise<Response> {
    try {
      const data: StorageCreatePayload[] = [];

      for await (const part of payload) {
        const sended = await this.service.upload(part);
        data.push(sended);
      }

      const storages = await this.storageRepository.createMany(data);

      return right(storages);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'STORAGE_UPLOAD_ERROR',
        ),
      );
    }
  }
}
