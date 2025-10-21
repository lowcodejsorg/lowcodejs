import { Either, left, right } from '@core/either.core';
import { User as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { GetUserByIdSchema } from '@validators/users';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class GetUserByIdUseCase {
  async execute(payload: z.infer<typeof GetUserByIdSchema>): Promise<Response> {
    try {
      const user = await Model.findOne({ _id: payload._id }).populate([
        {
          path: 'group',
        },
      ]);

      if (!user)
        return left(
          ApplicationException.NotFound('User not found', 'USER_NOT_FOUND'),
        );

      return right({
        ...user?.toJSON({
          flattenObjectIds: true,
        }),
        _id: user?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'GET_USER_BY_ID_ERROR',
        ),
      );
    }
  }
}
