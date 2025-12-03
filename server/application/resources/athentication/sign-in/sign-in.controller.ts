/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import type {
  JWTPayload,
  Permission,
  UserGroup,
} from '@application/core/entity.core';
import { Env } from '@start/env';

import { SignInSchema } from './sign-in.schema';
import SignInUseCase from './sign-in.use-case';
import { SignInBodyValidator } from './sign-in.validator';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    private readonly useCase: SignInUseCase = getInstanceByToken(SignInUseCase),
  ) {}

  @POST({
    url: '/sign-in',
    options: {
      schema: SignInSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = SignInBodyValidator.parse(request.body);
    const result = await this.useCase.execute(payload);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    const group: UserGroup = result?.value?.group as UserGroup;
    const permissions: Permission[] = group?.permissions as Permission[];

    const jwt: JWTPayload = {
      email: result?.value?.email,
      name: result?.value?.name,
      sub: result?.value?._id?.toString(),
      permissions: permissions?.flatMap((permission) => permission.slug),
      group: group.slug,
    };

    const accessToken = await response.jwtSign(jwt, {
      sub: result?.value?._id?.toString(),
      expiresIn: '1d',
    });

    const refreshToken = await response.jwtSign(
      {
        sub: result?.value?._id?.toString(),
        type: 'refresh',
      },
      {
        sub: result?.value?._id?.toString(),
        expiresIn: '7d',
      },
    );

    const cookieOptions = {
      path: '/',
      secure: Env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      httpOnly: true,
    };

    response
      .setCookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
      })
      .setCookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
      });

    return response.status(200).send();
  }
}
