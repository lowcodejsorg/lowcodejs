import { Either, left, right } from '@core/either.core';
import { UserGroup as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { UserGroup as Model } from '@model/user-group.model';
import { Service } from 'fastify-decorators';

type Response = Either<ApplicationException, Entity[]>;

@Service()
export default class ListUserGroupUseCase {
  async execute(): Promise<Response> {
    try {
      const groups = await Model.find();
      return right(
        groups.map((group) => ({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        })),
      );
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'LIST_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
