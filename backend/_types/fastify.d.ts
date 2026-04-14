import 'fastify';

declare module 'fastify' {
  export interface FastifyRequest {
    table?: import('@application/core/entity.core').ITable;
    ownership?: {
      isOwner: boolean;
      isAdministrator: boolean;
    };
    permissionContext?: {
      profile?: import('@application/core/entity.core').ValueOf<
        typeof import('@application/core/entity.core').E_COLLABORATION_PROFILE
      >;
      ownOnly?: boolean;
    };
  }
}
