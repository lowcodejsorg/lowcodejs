import type { FastifyReply, FastifyRequest } from 'fastify';

import ApplicationException from '@exceptions/application.exception';
import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import { Collection } from '@model/collection.model';

export async function CollaborationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    // Extract collection slug from request params
    const params = request.params as { slug?: string };

    if (!params.slug) {
      throw ApplicationException.BadRequest(
        'Collection slug is required',
        'INVALID_PARAMETERS',
      );
    }

    // Find collection with slug
    const collection = await Collection.findOne({
      slug: params.slug,
      trashed: false,
    });

    if (!collection) {
      throw ApplicationException.NotFound(
        'Collection not found',
        'COLLECTION_NOT_FOUND',
      );
    }

    // Store collection in request context to avoid duplicate queries
    request.collection = collection;

    // Check collaboration configuration
    if (collection.configuration?.collaboration === 'open') {
      // If collaboration is open, allow public access
      // Skip authentication - continue to next handler
      return;
    }

    // If collaboration is restricted, use authentication middleware
    await AuthenticationMiddleware(request, reply);
  } catch (error: unknown) {
    if (error instanceof ApplicationException) {
      return reply.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    // Unexpected error
    return reply.status(500).send({
      message: 'Internal server error',
      code: 500,
      cause: 'SERVER_ERROR',
    });
  }
}
