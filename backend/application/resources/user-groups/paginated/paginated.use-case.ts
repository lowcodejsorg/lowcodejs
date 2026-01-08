/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IGroup as Entity,
  IMeta,
  Paginated,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { UserGroupPaginatedPayload } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = UserGroupPaginatedPayload;

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

      const meta: IMeta = {
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
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_USER_GROUP_PAGINATED_ERROR',
        ),
      );
    }
  }
}
