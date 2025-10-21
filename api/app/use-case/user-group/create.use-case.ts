import { Either, left, right } from '@core/either.core';
import { UserGroup as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { UserGroup as Model } from '@model/user-group.model';
import { CreateUserGroupSchema } from '@validators/user-group.validator';
import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import z from 'zod';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class CreateUserGroupUseCase {
  async execute(
    payload: z.infer<typeof CreateUserGroupSchema>,
  ): Promise<Response> {
    try {
      const slug = slugify(payload.name, { trim: true, lower: true });

      const group = await Model.findOne({
        slug,
      });

      if (group)
        return left(
          ApplicationException.Conflict('Group already exists', 'GROUP_EXISTS'),
        );

      if (!(payload?.permissions?.length > 0))
        return left(
          ApplicationException.BadRequest(
            'Ao menos uma permissão deve ser informada para o grupo de usuários',
          ),
        );

      const created = await Model.create({
        ...payload,
        slug,
      });

      const populated = await created.populate([
        {
          path: 'permissions',
        },
      ]);

      return right({
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'CREATE_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
