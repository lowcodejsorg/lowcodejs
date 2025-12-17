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
import { normalize } from '@application/core/util.core';
import { User as Model } from '@application/model/user.model';

import type { UserPaginatedQueryValidator } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = z.infer<typeof UserPaginatedQueryValidator>;

@Service()
export default class UserPaginatedUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const skip = (payload.page - 1) * payload.perPage;

      const query: Record<string, object> = {};

      if (payload.sub) {
        query._id = { $ne: payload.sub };
      }

      if (payload.search) {
        query.$or = [
          { name: { $regex: normalize(payload.search), $options: 'i' } },
          { email: { $regex: normalize(payload.search), $options: 'i' } },
        ];
      }

      const users = await Model.find(query)
        .populate([
          {
            path: 'group',
          },
        ])
        .skip(skip)
        .limit(payload.perPage)
        .sort({ name: 'asc' });

      const total = await Model.countDocuments(query);

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
        data: users?.map((u) => ({
          ...u?.toJSON(),
          _id: u?._id.toString(),
        })),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_USER_PAGINATED_ERROR',
        ),
      );
    }
  }
}
