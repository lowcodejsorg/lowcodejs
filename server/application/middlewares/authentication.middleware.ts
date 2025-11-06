import { type FastifyReply, type FastifyRequest } from 'fastify';

import type { JWTPayload } from '@application/core/entity.core';

export async function AuthenticationMiddleware(
  request: FastifyRequest,
  response: FastifyReply,
): Promise<void> {
  try {
    const decoded: JWTPayload = await request.jwtVerify();

    request.user = {
      sub: decoded.sub ?? undefined,
      email: decoded?.email ?? undefined,
      name: decoded?.name ?? undefined,
      group: decoded?.group ?? undefined,
      permissions: decoded?.permissions ?? undefined,
    };
  } catch (error) {
    console.error(error);
    return response.status(401).send({
      code: 401,
      message: 'Unauthorized',
      cause: 'AUTHENTICATION_REQUIRED',
    });
  }
}
