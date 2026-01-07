import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroup } from '@application/model/user-group.model';
import { User as Model } from '@application/model/user.model';

import type { SignUpBodyValidator } from './sign-up.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof SignUpBodyValidator>;
@Service()
export default class SignUpUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await Model.findOne({ email: payload.email });

      if (user)
        return left(
          HTTPException.Conflict('User already exists', 'USER_ALREADY_EXISTS'),
        );

      const group = await UserGroup.findOne({ slug: 'registered' });

      if (!group)
        return left(
          HTTPException.Conflict('Group not found', 'GROUP_NOT_FOUND'),
        );

      const passwordHash = await hash(payload.password, 6);

      const created = await Model.create({
        ...payload,
        password: passwordHash,
        group: group._id.toString(),
        // remover depois
        status: 'active',
      });

      // const code = Math.floor(100000 + Math.random() * 900000).toString();

      // await ValidationToken.create({
      //   code,
      //   status: TOKEN_STATUS.REQUESTED,
      //   user: created._id.toString(),
      // });

      // console.info({ code });

      // enviar email de boas vindas/confirmação de cadastro

      return right({
        ...created.toJSON({
          flattenObjectIds: true,
        }),
        _id: created._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SIGN_UP_ERROR',
        ),
      );
    }
  }
}
