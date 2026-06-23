import { type FastifyRequest } from 'fastify';

import { E_JWT_TYPE, type IJWTPayload } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { getRequestCookie } from '@application/utils/cookies.util';

interface AuthOptions {
  optional?: boolean;
}

export function AuthenticationMiddleware(
  options: AuthOptions = { optional: false },
) {
  return async function (request: FastifyRequest): Promise<void> {
    try {
      const accessToken = getRequestCookie(request, 'accessToken');

      if (!accessToken) {
        if (options.optional) return;
        throw HTTPException.Unauthorized(
          'Autenticação necessária',
          'AUTHENTICATION_REQUIRED',
        );
      }

      const accessTokenDecoded: IJWTPayload | null =
        await request.server.jwt.decode(String(accessToken));

      if (
        !accessTokenDecoded ||
        accessTokenDecoded.type !== E_JWT_TYPE.ACCESS
      ) {
        if (options.optional) return;
        throw HTTPException.Unauthorized(
          'Autenticação necessária',
          'AUTHENTICATION_REQUIRED',
        );
      }

      request.user = {
        sub: accessTokenDecoded.sub,
        email: accessTokenDecoded.email,
        role: accessTokenDecoded.role,
        type: E_JWT_TYPE.ACCESS,
      };
    } catch (error) {
      console.error(error);
      if (options.optional) return;

      throw HTTPException.Unauthorized(
        'Autenticação necessária',
        'AUTHENTICATION_REQUIRED',
      );
    }
  };
}
