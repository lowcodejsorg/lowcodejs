/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import DeleteCollectionUseCase from '@use-case/collections/delete.use-case';
import { GetCollectionBySlugSchema } from '@validators/collections.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: DeleteCollectionUseCase = getInstanceByToken(
      DeleteCollectionUseCase,
    ),
  ) {}

  @DELETE({
    url: '/:slug',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Collections'],
        summary: 'Delete collection',
        description:
          'Permanently deletes a collection and all its associated data. This action cannot be undone.',
        security: [{ cookieAuth: [] }],
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: {
              type: 'string',
              description: 'Collection slug identifier',
              examples: ['users', 'products', 'blog-posts'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description: 'Collection deleted successfully',
            type: 'object',
            properties: {},
          },
          401: {
            description: 'Unauthorized - Authentication required',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Unauthorized'] },
              code: { type: 'number', enum: [401] },
              cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
            },
          },
          404: {
            description:
              'Not found - Collection with specified slug does not exist',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Collection not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['COLLECTION_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'Collection not found',
                code: 404,
                cause: 'COLLECTION_NOT_FOUND',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['DELETE_COLLECTION_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = GetCollectionBySlugSchema.parse(request.params);

    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send();
  }
}
