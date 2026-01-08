/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { UserGroupUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = UserGroupUpdatePayload;

@Service()
export default class UserGroupUpdateUseCase {
  constructor(
    private readonly userGroupRepository: UserGroupContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const group = await this.userGroupRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!group)
        return left(
          HTTPException.NotFound(
            'Grupo de usuarios nao foi encontrado',
            'USER_GROUP_NOT_FOUND',
          ),
        );

      if (!(payload?.permissions?.length > 0))
        return left(
          HTTPException.BadRequest(
            'Ao menos uma permissao deve ser informada para o grupo de usuarios',
          ),
        );

      const updated = await this.userGroupRepository.update(payload);

      return right(updated);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
