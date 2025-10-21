import type { JWTPayload } from '@core/entity.core';

import '@fastify/jwt';

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: JWTPayload;
  }
}
