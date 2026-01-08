/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { UserGroupCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = UserGroupCreatePayload;

@Service()
export default class UserGroupCreateUseCase {
  constructor(
    private readonly userGroupRepository: UserGroupContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const slug = slugify(payload.name, { trim: true, lower: true });

      const group = await this.userGroupRepository.findBy({
        slug,
        exact: true,
      });

      if (group)
        return left(
          HTTPException.Conflict('Group already exists', 'GROUP_EXISTS'),
        );

      if (!(payload?.permissions?.length > 0))
        return left(
          HTTPException.BadRequest(
            'Ao menos uma permissao deve ser informada para o grupo de usuarios',
          ),
        );

      const created = await this.userGroupRepository.create({
        ...payload,
        slug,
      });

      return right(created);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
