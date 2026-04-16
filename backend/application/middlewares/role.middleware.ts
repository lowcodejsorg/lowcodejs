import { type FastifyRequest } from 'fastify';

import { type ValueOf, E_ROLE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';

type Role = ValueOf<typeof E_ROLE>;

export function RoleMiddleware(allowedRoles: Role[]) {
  const allowed = new Set(allowedRoles);

  return async function (request: FastifyRequest): Promise<void> {
    if (!request.user) {
      throw HTTPException.Unauthorized(
        'Autenticação necessária',
        'AUTHENTICATION_REQUIRED',
      );
    }

    if (!allowed.has(request.user.role)) {
      throw HTTPException.Forbidden(
        'Permissão insuficiente para esta operação',
        'FORBIDDEN',
      );
    }
  };
}
