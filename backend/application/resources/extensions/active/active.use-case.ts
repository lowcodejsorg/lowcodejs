/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IExtension } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { ExtensionContractRepository } from '@application/repositories/extension/extension-contract.repository';

export type ActiveExtension = Omit<IExtension, 'manifestSnapshot'>;

type Response = Either<HTTPException, ActiveExtension[]>;

@Service()
export default class ExtensionActiveListUseCase {
  constructor(
    private readonly extensionRepository: ExtensionContractRepository,
  ) {}

  async execute(): Promise<Response> {
    try {
      const extensions = await this.extensionRepository.findMany({
        enabled: true,
        available: true,
      });

      const projected = extensions.map<ActiveExtension>((extension) => {
        const { manifestSnapshot: _ignored, ...rest } = extension;
        return rest;
      });

      return right(projected);
    } catch (error) {
      console.error('[extensions > active][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_ACTIVE_EXTENSIONS_ERROR',
        ),
      );
    }
  }
}
