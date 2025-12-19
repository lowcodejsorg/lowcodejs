import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { UserGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroup as Model } from '@application/model/user-group.model';

import type { UserCreateGroupBodyValidator } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof UserCreateGroupBodyValidator>;

@Service()
export default class UserGroupCreateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const slug = slugify(payload.name, { trim: true, lower: true });

      const group = await Model.findOne({
        slug,
      });

      if (group)
        return left(
          HTTPException.Conflict('Group already exists', 'GROUP_EXISTS'),
        );

      if (!(payload?.permissions?.length > 0))
        return left(
          HTTPException.BadRequest(
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
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_USER_GROUP_ERROR',
        ),
      );
    }
  }
}
