/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import type { JWTPayload, Permission, UserGroup } from '@core/entity.core';
import { Env } from '@start/env';
import MagicLinkUseCase from '@use-case/authentication/magic-link.use-case';
import { AuthenticationMagicLinkSchema } from '@validators/authentication.validator';

@Controller({
  route: '/authentication',
})
export default class {
  constructor(
    private readonly useCase: MagicLinkUseCase = getInstanceByToken(
      MagicLinkUseCase,
    ),
  ) {}

  @GET({
    url: '/magic-link',
    options: {
      schema: {
        tags: ['Authentication'],
        summary: 'Magic link authentication',
        description:
          'Authenticates user via magic link and redirects to dashboard with authentication cookies set',
        querystring: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              type: 'string',
              description: 'Magic link authentication code',
            },
          },
        },
        response: {
          302: {
            description: 'Successful authentication - redirects to dashboard',
            type: 'object',
            properties: {},
          },
          400: {
            description: 'Bad request - Invalid or expired magic link code',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Invalid magic link code', 'Magic link has expired'],
              },
              code: { type: 'number', enum: [400] },
              cause: { type: 'string', enum: ['INVALID_CODE', 'CODE_EXPIRED'] },
            },
            examples: [
              {
                message: 'Invalid magic link code',
                code: 400,
                cause: 'INVALID_CODE',
              },
              {
                message: 'Magic link has expired',
                code: 400,
                cause: 'CODE_EXPIRED',
              },
            ],
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['INTERNAL_SERVER_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'INTERNAL_SERVER_ERROR',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = AuthenticationMagicLinkSchema.parse(request.query);

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
      sub: result?.value?._id?.toString(),
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
      secure: Env.NODE_ENV === 'production', // Only HTTPS in production
      sameSite: 'strict' as const, // Stricter CSRF protection
      httpOnly: true,
      // domain: Env.NODE_ENV === 'production' ? Env.COOKIE_DOMAIN : undefined,
    };

    response
      .setCookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 1000, // 1 day in ms
      })
      .setCookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

    return response
      .status(302)
      .redirect(Env.APP_CLIENT_URL.concat('/dashboard?authentication=success'));
  }
}
