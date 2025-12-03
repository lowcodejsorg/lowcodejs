import { type FastifyRequest } from 'fastify';

import HTTPException from '@application/core/exception.core';

interface AuthOptions {
  optional?: boolean;
}

export function AuthenticationMiddleware(options: AuthOptions = {}) {
  const { optional = false } = options;

  return async function (request: FastifyRequest): Promise<void> {
    try {
      await request.jwtVerify();
    } catch (error) {
      if (optional) return;

      console.error('Authentication error:', error);
      throw HTTPException.Unauthorized(
        'Authentication required',
        'AUTHENTICATION_REQUIRED',
      );
    }
  };
}
