import { Either, left, right } from '@core/either.core';
import { User as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { User as Model } from '@model/user.model';
import { Service } from 'fastify-decorators';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class {
  async execute(payload: { user: string }): Promise<Response> {
    try {
      const user = await Model.findOne({ _id: payload.user });

      if (!user) {
        return left(
          ApplicationException.NotFound('User not found', 'USER_NOT_FOUND'),
        );
      }

      // Opcional: verificar se o usuário ainda está ativo
      // if (!user.active) {
      //   return left(ApplicationException.Unauthorized('Usuário inativo'));
      // }

      return right({
        ...user.toJSON({
          flattenObjectIds: true,
        }),
        _id: user._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'REFRESH_TOKEN_ERROR',
        ),
      );
    }
  }
}
