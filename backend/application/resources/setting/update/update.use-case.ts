/* eslint-disable no-unused-vars */
import { Inject, Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { isValidObjectId } from '@application/core/object-id.util';
import {
  SettingContractRepository,
  SettingUpdatePayload,
} from '@application/repositories/setting/setting-contract.repository';
import { StorageContractService } from '@application/services/storage/storage-contract.service';

const BUILTIN_TEMPLATE_IDS = new Set([
  'KANBAN_TEMPLATE',
  'CARDS_TEMPLATE',
  'MOSAIC_TEMPLATE',
  'DOCUMENT_TEMPLATE',
]);

type Response = Either<HTTPException, Record<string, unknown>>;

@Service()
export default class SettingUpdateUseCase {
  @Inject(StorageContractService)
  private readonly storageService!: StorageContractService;

  constructor(private readonly settingRepository: SettingContractRepository) {}

  async execute(payload: SettingUpdatePayload): Promise<Response> {
    try {
      if (Array.isArray(payload.MODEL_CLONE_TABLES)) {
        payload.MODEL_CLONE_TABLES = payload.MODEL_CLONE_TABLES.filter(
          (id) => !BUILTIN_TEMPLATE_IDS.has(id) && isValidObjectId(id),
        );
      }

      const updated = await this.settingRepository.update(payload);

      if (payload.STORAGE_DRIVER === 's3') {
        await this.storageService.ensureBucket();
      }

      return right({
        ...updated,
        FILE_UPLOAD_ACCEPTED: updated.FILE_UPLOAD_ACCEPTED?.split(';') ?? [],
        // MODEL_CLONE_TABLES já vem populado do repository
      });
    } catch (error) {
      console.error('[setting > update][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro ao atualizar configurações',
          'SETTINGS_UPDATE_ERROR',
        ),
      );
    }
  }
}
