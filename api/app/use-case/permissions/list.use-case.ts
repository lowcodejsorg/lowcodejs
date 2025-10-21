import { Either, left, right } from '@core/either.core';
import { Permission as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { Permission as Model } from '@model/permission.model';
import { Service } from 'fastify-decorators';

type Resultado = Either<ApplicationException, Entity[]>;

@Service()
export default class ListPermissionUseCase {
  async execute(): Promise<Resultado> {
    try {
      const permissions = await Model.find();
      return right(
        permissions.map((permission) => ({
          ...permission.toJSON({
            flattenObjectIds: true,
          }),
          _id: permission._id.toString(),
        })),
      );
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'LIST_PERMISSION_ERROR',
        ),
      );
    }
  }
}
