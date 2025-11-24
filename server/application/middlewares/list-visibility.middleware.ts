import type { FastifyReply, FastifyRequest } from 'fastify';

import type { Table } from '@application/core/entity.core';
import { Table as Model } from '@application/model/table.model';

import { AuthenticationMiddleware } from './authentication.middleware';

export async function ListVisibilityMiddleware(
  request: FastifyRequest,
  response: FastifyReply,
): Promise<void> {
  try {
    const params = request.params as { slug?: string };

    if (!params.slug) {
      return response.status(400).send({
        message: 'Table slug is required',
        code: 400,
        cause: 'INVALID_PARAMETERS',
      });
    }

    // Find table with slug
    const table = await Model.findOne({
      slug: params.slug,
      trashed: false,
    });

    if (!table) {
      return response.status(404).send({
        message: 'Table not found',
        code: 404,
        cause: 'TABLE_NOT_FOUND',
      });
    }

    request.table = table as unknown as Table;

    const visibility = table.configuration?.visibility;

    // await request.jwtVerify();

    if (
      !request?.user?.sub &&
      visibility === 'public' &&
      request.method === 'GET'
    )
      return;

    if (
      !request?.user?.sub &&
      visibility === 'form' &&
      request.method === 'POST'
    )
      return;

    await AuthenticationMiddleware(request, response);
  } catch (error) {
    console.error('ERROR ON LIST VISIBILITY MIDDLEWARE', error);
    return response.status(500).send({
      message: 'Internal server error',
      code: 500,
      cause: 'SERVER_ERROR',
    });
  }
}
