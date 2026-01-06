/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  User as Entity,
  Meta,
  Paginated,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

import type { UserPaginatedQueryValidator } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = z.infer<typeof UserPaginatedQueryValidator>;

@Service()
export default class UserPaginatedUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const query = {
        ...payload,
        _id: payload.sub,
      };

      delete query.sub;

      const users = await this.userRepository.findMany(query);

      const total = await this.userRepository.count(query);

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
        data: users,
      });
    } catch (_error) {
      // console.error(_error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_USER_PAGINATED_ERROR',
        ),
      );
    }
  }
}
