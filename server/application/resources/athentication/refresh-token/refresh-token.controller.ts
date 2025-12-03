import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import type {
  JWTPayload,
  Permission,
  UserGroup,
} from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Env } from '@start/env';

import { RefreshTokenSchema } from './refresh-token.schema';
import RefreshTokenUseCase from './refresh-token.use-case';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: RefreshTokenUseCase = getInstanceByToken(
      RefreshTokenUseCase,
    ),
  ) {}

  @POST({
    url: '/refresh-token',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: RefreshTokenSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    try {
      const refreshToken = request.cookies.refreshToken;

      if (!refreshToken) {
        return response.status(401).send({
          message: 'Missing refresh token',
          code: 401,
          cause: 'MISSING_REFRESH_TOKEN',
        });
      }

      // Verifies and decodes the refresh token
      const decoded: JWTPayload = await request.jwtVerify();

      const result = await this.useCase.execute({ user: decoded.sub });

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
        sub: result?.value?._id?.toString() as string,
      };

      const newAccessToken = await response.jwtSign(jwt, {
        sub: result?.value?._id?.toString() as string,
        expiresIn: '1d',
      });

      const newRefreshToken = await response.jwtSign(
        {
          sub: result?.value?._id?.toString() as string,
          type: 'refresh',
        },
        {
          sub: result?.value?._id?.toString() as string,
          expiresIn: '7d',
        },
      );

      const cookieOptions = {
        path: '/',
        secure: Env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        httpOnly: true,
      };

      // Set the new cookies
      response
        .setCookie('accessToken', newAccessToken, {
          ...cookieOptions,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        })
        .setCookie('refreshToken', newRefreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

      return response
        .status(200)
        .send({ message: 'Tokens refreshed successfully' });
    } catch (error) {
      console.error(error);
      // Invalid, expired or malformed token
      return response.status(401).send({
        message: 'Invalid or expired refresh token',
        code: 401,
        cause: 'INVALID_REFRESH_TOKEN',
      });
    }
  }
}
