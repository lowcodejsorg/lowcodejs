/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import type { JWTPayload, Permission, UserGroup } from '@core/entity.core';
import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import { Env } from '@start/env';
import RefreshTokenUseCase from '@use-case/authentication/refresh-token.use-case';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    private readonly useCase: RefreshTokenUseCase = getInstanceByToken(
      RefreshTokenUseCase,
    ),
  ) {}

  @POST({
    url: '/refresh-token',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Authentication'],
        summary: 'Refresh authentication tokens',
        description:
          'Refreshes access and refresh tokens using the current refresh token from cookies. Requires valid refresh token cookie.',
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            description: 'Tokens refreshed successfully',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Tokens refreshed successfully'],
              },
            },
          },
          401: {
            description: 'Unauthorized - Missing or invalid refresh token',
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Error message' },
              code: { type: 'number', enum: [401] },
              cause: {
                type: 'string',
                enum: ['MISSING_REFRESH_TOKEN', 'INVALID_REFRESH_TOKEN'],
              },
            },
            examples: [
              {
                message: 'Missing refresh token',
                code: 401,
                cause: 'MISSING_REFRESH_TOKEN',
              },
              {
                message: 'Invalid or expired refresh token',
                code: 401,
                cause: 'INVALID_REFRESH_TOKEN',
              },
            ],
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['REFRESH_TOKEN_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'REFRESH_TOKEN_ERROR',
              },
            ],
          },
        },
      },
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
        group: {
          name: group?.name,
          description: group?.description,
          slug: group?.slug,
        },
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
      // Invalid, expired or malformed token
      return response.status(401).send({
        message: 'Invalid or expired refresh token',
        code: 401,
        cause: 'INVALID_REFRESH_TOKEN',
      });
    }
  }
}
