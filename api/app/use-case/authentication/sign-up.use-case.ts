import { Either, left, right } from '@core/either.core';
import { User as Entity, TOKEN_STATUS } from '@core/entity.core';
import ApplicationException from '@exceptions/application.exception';
import { UserGroup } from '@model/user-group.model';
import { User as Model } from '@model/user.model';
import { ValidationToken } from '@model/validation-token.model';
import { AuthenticationSignUpSchema } from '@validators/authentication.validator';
import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import z from 'zod';

type Response = Either<ApplicationException, Entity>;

@Service()
export default class SignUpUseCase {
  async execute(
    payload: z.infer<typeof AuthenticationSignUpSchema>,
  ): Promise<Response> {
    try {
      const user = await Model.findOne({ email: payload.email });

      if (user)
        return left(
          ApplicationException.Conflict(
            'User already exists',
            'USER_ALREADY_EXISTS',
          ),
        );

      const group = await UserGroup.findOne({ slug: 'registered' });

      if (!group)
        return left(
          ApplicationException.Conflict('Group not found', 'GROUP_NOT_FOUND'),
        );

      const passwordHash = await hash(payload.password, 6);

      const created = await Model.create({
        ...payload,
        password: passwordHash,
        group: group._id.toString(),
      });

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await ValidationToken.create({
        code,
        status: TOKEN_STATUS.REQUESTED,
        user: created._id.toString(),
      });

      console.info({ code });

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
        ApplicationException.InternalServerError(
          'Internal server error',
          'SIGN_UP_ERROR',
        ),
      );
    }
  }
}
