import type { FastifyReply, FastifyRequest } from 'fastify';

import type { JWTPayload } from '@core/entity.core';
import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import { Collection } from '@model/collection.model';

export async function ListVisibilityMiddleware(
  request: FastifyRequest,
  response: FastifyReply,
): Promise<void> {
  try {
    const decoded: JWTPayload = await request.jwtVerify();

    // Extract collection slug from request params
    const params = request.params as { slug?: string };

    if (!params.slug) {
      return response.status(400).send({
        message: 'Collection slug is required',
        code: 400,
        cause: 'INVALID_PARAMETERS',
      });
    }

    // Find collection with slug
    const collection = await Collection.findOne({
      slug: params.slug,
      trashed: false,
    });

    if (!collection) {
      return response.status(404).send({
        message: 'Collection not found',
        code: 404,
        cause: 'COLLECTION_NOT_FOUND',
      });
    }

    // Store collection in request context to avoid duplicate queries
    request.collection = collection;

    console.log(decoded);

    // const allowedVisibility = ["public", "ope"]

    console.log('AQUIIIIIIIIIIIIIII', params.slug, request.user);

    if (
      !request.user &&
      collection.configuration?.visibility === 'form' &&
      request.method === 'POST'
    ) {
      return;
    }

    if (
      !request.user &&
      collection.configuration?.visibility === 'public' &&
      request.method === 'GET'
    ) {
      return;
    }

    // If collaboration is restricted, use authentication middleware

    console.log(
      'Collaboration visibility:',
      collection.configuration?.collaboration,
    );
    await AuthenticationMiddleware(request, response);
  } catch (error) {
    console.error(error);
    return response.status(500).send({
      message: 'Internal server error',
      code: 500,
      cause: 'SERVER_ERROR',
    });
  }
}
