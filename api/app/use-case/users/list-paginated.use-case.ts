import { Either, left, right } from '@core/either.core';
import { User as Entity, Meta, Paginated } from '@core/entity.core';
import { normalize } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { ListUserPaginatedSchema } from '@validators/users';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, Paginated<Entity[]>>;

@Service()
export default class ListUserPaginatedUseCase {
  async execute(
    payload: z.infer<typeof ListUserPaginatedSchema>,
  ): Promise<Response> {
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
        ApplicationException.InternalServerError(
          'Internal server error',
          'LIST_USER_PAGINATED_ERROR',
        ),
      );
    }
  }
}
