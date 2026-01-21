/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import type {
  SettingContractRepository,
  SettingUpdatePayload,
} from '@application/repositories/setting/setting-contract.repository';

type Response = Either<HTTPException, Record<string, unknown>>;

@Service()
export default class SettingUpdateUseCase {
  constructor(private readonly settingRepository: SettingContractRepository) {}

  async execute(payload: SettingUpdatePayload): Promise<Response> {
    try {
      const updated = await this.settingRepository.update(payload);

      for (const [key, value] of Object.entries(payload)) {
        process.env[key] = String(value);
      }

      return right({
        ...updated,
        FILE_UPLOAD_ACCEPTED: updated.FILE_UPLOAD_ACCEPTED?.split(';') ?? [],
        MODEL_CLONE_TABLES: updated.MODEL_CLONE_TABLES?.split(';') ?? [],
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Erro ao atualizar configurações',
          'SETTINGS_UPDATE_ERROR',
        ),
      );
    }
  }
}
