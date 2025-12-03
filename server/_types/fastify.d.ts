import 'fastify';

declare module 'fastify' {
  export interface FastifyRequest {
    table?: import('@application/core/entity.core').Table;
    ownership?: {
      isOwner: boolean;
      isAdministrator: boolean;
    };
  }
}
