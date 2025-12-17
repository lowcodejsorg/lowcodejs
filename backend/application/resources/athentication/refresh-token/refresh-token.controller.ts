import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import type { JWTPayload } from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { setCookieTokens } from '@application/utils/cookies.util';
import { createTokens } from '@application/utils/jwt.util';

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

      const refreshTokenDecoded: JWTPayload | null =
        await request.server.jwt.decode(refreshToken);

      if (!refreshTokenDecoded || refreshTokenDecoded.type !== 'refresh') {
        return response.status(401).send({
          message: 'Invalid or expired refresh token',
          code: 401,
          cause: 'INVALID_REFRESH_TOKEN',
        });
      }

      const result = await this.useCase.execute({
        user: refreshTokenDecoded.sub,
      });

      if (result.isLeft()) {
        const error = result.value;

        return response.status(error.code).send({
          message: error.message,
          code: error.code,
          cause: error.cause,
        });
      }

      const tokens = await createTokens(result.value, response);

      setCookieTokens(response, { ...tokens });

      return response.status(200).send();
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
