import { Service } from 'fastify-decorators';

import { Either, left, right } from '@core/either.core';
import { UserGroup as Entity } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { UserGroup as Model } from '@model/user-group.model';
import {
  GetUserGroupByIdSchema,
  UpdateUserGroupSchema,
} from '@validators/user-group.validator';
import z from 'zod';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class UpdateUserGroupUseCase {
  async execute(
    payload: z.infer<typeof UpdateUserGroupSchema> &
      z.infer<typeof GetUserGroupByIdSchema>,
  ): Promise<Response> {
    try {
      const group = await Model.findOne({
        _id: payload._id,
      }).populate([
        {
          path: 'permissions',
        },
      ]);

      if (!group)
        return left(
          ApplicationException.NotFound('Grupo de usuários não foi encontrado'),
        );

      if (!(payload?.permissions?.length > 0))
        return left(
          ApplicationException.BadRequest(
            'Ao menos uma permissão deve ser informada para o grupo de usuários',
          ),
        );

      await group
        .set({
          ...group?.toJSON({
            flattenObjectIds: true,
          }),
          ...payload,
        })
        .save();

      return right({
        ...group?.toJSON({
          flattenObjectIds: true,
        }),
        _id: group?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
