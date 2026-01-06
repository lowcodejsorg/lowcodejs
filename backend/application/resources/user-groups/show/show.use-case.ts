/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { UserGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { UserGroupShowParamValidator } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof UserGroupShowParamValidator>;

@Service()
export default class UserGroupShowUseCase {
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
            'Grupo de usuarios nao encontrado',
            'USER_GROUP_NOT_FOUND',
          ),
        );

      return right(group);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_USER_GROUP_BY_ID_ERROR',
        ),
      );
    }
  }
}
