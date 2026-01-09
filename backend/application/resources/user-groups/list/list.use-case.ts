/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  E_ROLE,
  IGroup as Entity,
  IUser,
  Merge,
  ValueOf,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

type Response = Either<HTTPException, Entity[]>;
type Payload = {
  user?: Merge<Pick<IUser, '_id'>, { role: ValueOf<typeof E_ROLE> }>;
};

@Service()
export default class UserGroupListUseCase {
  constructor(
    private readonly userGroupRepository: UserGroupContractRepository,
  ) {}

  async execute(payload?: Payload): Promise<Response> {
    try {
      const groups = await this.userGroupRepository.findMany({
        user: payload?.user,
      });

      return right(groups);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
