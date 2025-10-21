/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import type { JWTPayload, Permission, UserGroup } from '@core/entity.core';
import { Env } from '@start/env';
import SignInUseCase from '@use-case/authentication/sign-in.use-case';
import { AuthenticationSignInSchema } from '@validators/authentication.validator';

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
      schema: {
        tags: ['Authentication'],
        summary: 'User authentication sign in',
        description:
          'Authenticates a user with email and password, returning JWT tokens as HTTP-only cookies',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              description: 'User password',
            },
          },
        },
        response: {
          200: {
            description:
              'Successful authentication - Sets httpOnly cookies for accessToken and refreshToken',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Authentication successful'] },
            },
            headers: {
              'Set-Cookie': {
                type: 'string',
                description:
                  'Authentication cookies (accessToken, refreshToken)',
              },
            },
          },
          400: {
            description:
              'Bad request - Invalid request format or Zod validation failed',
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Error description' },
              code: { type: 'number', enum: [400] },
              cause: { type: 'string', enum: ['INVALID_PARAMETERS'] },
            },
          },
          401: {
            description:
              'Unauthorized - User not found, inactive, or wrong password',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Specific error message',
              },
              code: { type: 'number', enum: [401] },
              cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
            },
            examples: [
              {
                message: 'Unauthorized',
                code: 401,
                cause: 'AUTHENTICATION_REQUIRED',
              },
              {
                message: 'Unauthorized',
                code: 401,
                cause: 'AUTHENTICATION_REQUIRED',
              },
              {
                message: 'Credenciais invalidas',
                code: 401,
                cause: 'AUTHENTICATION_REQUIRED',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Internal server error' },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['SIGN_IN_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = AuthenticationSignInSchema.parse(request.body);
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
      permissions: permissions?.flatMap((permission) => permission.slug),
      group: {
        name: group?.name,
        description: group?.description,
        slug: group?.slug,
      },
      sub: result?.value?._id?.toString() as string,
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

    return response.status(200).send({ message: 'Authentication successful' });
  }
}
