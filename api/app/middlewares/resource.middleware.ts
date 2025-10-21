import type { FastifyReply, FastifyRequest } from 'fastify';

export function ResourceMiddleware(resource: string) {
  return async (
    request: FastifyRequest,
    response: FastifyReply,
  ): Promise<void> => {
    const query = request.query as Record<string, string>;
    const accessToken =
      request.headers?.cookie?.replace(/^accessToken=/, '')?.trim() ??
      request?.cookies?.accessToken?.trim();

    const isPublic = query.public === 'true';

    if (!isPublic && accessToken) {
      const user = request.user;

      if (!user) {
        return response.status(401).send({
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
          message: 'Unauthorized',
        });
      }

      const hasResourcePermission = user?.permissions?.some(
        (permission) => permission === resource,
      );

      if (!hasResourcePermission) {
        return response.status(500).send({
          code: 500,
          cause: 'UNAUTHORIZED_RESOURCE',
          message: 'Unauthorized resource',
        });
      }
    }
  };
}
