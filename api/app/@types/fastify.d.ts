import 'fastify';

declare module 'fastify' {
  export interface FastifyRequest {
    collection?: any;
  }
}
