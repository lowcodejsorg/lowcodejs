import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import type {
  JWTPayload,
  Permission,
  UserGroup,
} from '@application/core/entity.core';
import { Env } from '@start/env';

import { MagicLinkSchema } from './magic-link.schema';
import MagicLinkUseCase from './magic-link.use-case';
import { MagicLinkBodyValidator } from './magic-link.validator';

@Controller({
  route: '/authentication',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MagicLinkUseCase = getInstanceByToken(
      MagicLinkUseCase,
    ),
  ) {}

  @GET({
    url: '/magic-link',
    options: {
      schema: MagicLinkSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = MagicLinkBodyValidator.parse(request.query);

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
      group: group.slug,
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
