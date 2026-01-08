/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IPermission as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { PermissionContractRepository } from '@application/repositories/permission/permission-contract.repository';

type Resultado = Either<HTTPException, Entity[]>;

@Service()
export default class PermissionListUseCase {
  constructor(
    private readonly permissionRepository: PermissionContractRepository,
  ) {}

  async execute(): Promise<Resultado> {
    try {
      const permissions = await this.permissionRepository.findMany();
      return right(permissions);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_PERMISSION_ERROR',
        ),
      );
    }
  }
}
