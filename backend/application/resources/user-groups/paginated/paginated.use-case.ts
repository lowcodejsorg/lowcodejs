/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  UserGroup as Entity,
  Meta,
  Paginated,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { UserGroupPaginatedQueryValidator } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = z.infer<typeof UserGroupPaginatedQueryValidator>;

@Service()
export default class UserGroupPaginatedUseCase {
  constructor(
    private readonly userGroupRepository: UserGroupContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const groups = await this.userGroupRepository.findMany({
        page: payload.page,
        perPage: payload.perPage,
        search: payload.search,
      });

      const total = await this.userGroupRepository.count({
        search: payload.search,
      });

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: Meta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      return right({
        meta,
        data: groups,
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_USER_GROUP_PAGINATED_ERROR',
        ),
      );
    }
  }
}
