import { Either, left, right } from '@core/either.core';
import { UserGroup as Entity, Meta, Paginated } from '@core/entity.core';
import { normalize } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { UserGroup as Model } from '@model/user-group.model';
import { ListUserGroupPaginatedSchema } from '@validators/user-group.validator';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, Paginated<Entity[]>>;

@Service()
export default class ListUserGroupPaginatedUseCase {
  async execute(
    payload: z.infer<typeof ListUserGroupPaginatedSchema>,
  ): Promise<Response> {
    try {
      const skip = (payload.page - 1) * payload.perPage;

      const query: Record<string, object> = {};

      if (payload.search) {
        query.$or = [
          { name: { $regex: normalize(payload.search), $options: 'i' } },
          { description: { $regex: normalize(payload.search), $options: 'i' } },
        ];
      }

      const groups = await Model.find(query)
        .populate([
          {
            path: 'permissions',
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
        data: groups?.map((u) => ({
          ...u?.toJSON({
            flattenObjectIds: true,
          }),
          _id: u?._id.toString(),
        })),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'LIST_USER_GROUP_PAGINATED_ERROR',
        ),
      );
    }
  }
}
