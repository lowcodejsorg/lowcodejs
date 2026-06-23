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
    const accessToken = getRequestCookie(request, 'accessToken');

    // DEBUG temporário: revela se o cookie de auth chegou no backend em cada
    // 401 (F5/SSR x client). Remover após diagnóstico do redirect no Coolify.
    const logUnauthorized = (): void => {
      console.warn(
        `[auth:401] method=${request.method} url=${request.url} ` +
          `hasCookieHeader=${Boolean(request.headers.cookie)} ` +
          `cookies=[${Object.keys(request.cookies ?? {}).join(',')}] ` +
          `hasAccessToken=${Boolean(accessToken)} ` +
          `hasActiveAccountId=${Boolean(
            getRequestCookie(request, 'activeAccountId'),
          )}`,
      );
    };

    if (!accessToken) {
      if (options.optional) return;
      logUnauthorized();
      throw HTTPException.Unauthorized(
        'Autenticação necessária',
        'AUTHENTICATION_REQUIRED',
      );
    }

    let accessTokenDecoded: IJWTPayload | null = null;
    try {
      accessTokenDecoded = await request.server.jwt.decode(accessToken);
    } catch (error) {
      console.error('[auth:decode-error]', error);
      if (options.optional) return;
      logUnauthorized();
      throw HTTPException.Unauthorized(
        'Autenticação necessária',
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (!accessTokenDecoded || accessTokenDecoded.type !== E_JWT_TYPE.ACCESS) {
      if (options.optional) return;
      logUnauthorized();
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
  };
}
