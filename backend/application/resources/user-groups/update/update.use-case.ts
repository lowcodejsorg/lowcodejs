import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { UserGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroup as Model } from '@application/model/user-group.model';

import type {
  UserGroupUpdateBodyValidator,
  UserGroupUpdateParamValidator,
} from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof UserGroupUpdateBodyValidator> &
  z.infer<typeof UserGroupUpdateParamValidator>;

@Service()
export default class UserGroupUpdateUseCase {
  async execute(payload: Payload): Promise<Response> {
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
          HTTPException.NotFound('Grupo de usuários não foi encontrado'),
        );

      if (!(payload?.permissions?.length > 0))
        return left(
          HTTPException.BadRequest(
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
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
