/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { ISetting } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { SettingContractRepository } from '@application/repositories/setting/setting-contract.repository';

type Response = Either<HTTPException, ISetting | Record<string, unknown>>;

@Service()
export default class SettingShowUseCase {
  constructor(private readonly settingRepository: SettingContractRepository) {}

  async execute(): Promise<Response> {
    try {
      const setting = await this.settingRepository.get();

      if (!setting) {
        return right({
          ...process.env,
          FILE_UPLOAD_ACCEPTED:
            process.env.FILE_UPLOAD_ACCEPTED?.split(';') ?? [],
          MODEL_CLONE_TABLES: [],
        });
      }

      return right({
        ...setting,
        FILE_UPLOAD_ACCEPTED: setting.FILE_UPLOAD_ACCEPTED?.split(';') ?? [],
        // MODEL_CLONE_TABLES já vem populado do repository
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Erro ao buscar configurações',
          'SETTINGS_READ_ERROR',
        ),
      );
    }
  }
}
