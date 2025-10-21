/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import RemoveRowFromTrashUseCase from '@use-case/rows/remove-from-trash.use-case';
import {
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
} from '@validators/row-collection.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: RemoveRowFromTrashUseCase = getInstanceByToken(
      RemoveRowFromTrashUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:slug/rows/:_id/restore',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Rows'],
        summary: 'Remove row from trash',
        description:
          'Restores a row from trash by setting trashed=false and clearing trashedAt timestamp. Makes the row active again.',
        security: [{ cookieAuth: [] }],
        params: {
          type: 'object',
          required: ['slug', '_id'],
          properties: {
            slug: {
              type: 'string',
              description: 'Collection slug containing the row',
              examples: ['users', 'products', 'blog-posts'],
            },
            _id: {
              type: 'string',
              description: 'Row ID to restore from trash',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description: 'Row restored from trash successfully',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Row ID' },
              trashed: {
                type: 'boolean',
                enum: [false],
                description: 'Row is no longer in trash',
              },
              trashedAt: {
                type: 'string',
                nullable: true,
                description: 'Timestamp when moved to trash (now null)',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
            additionalProperties: true,
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
              'Not found - Collection or row does not exist or is not in trash',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Collection not found', 'Row not found'],
              },
              code: { type: 'number', enum: [404] },
              cause: {
                type: 'string',
                enum: ['COLLECTION_NOT_FOUND', 'ROW_NOT_FOUND'],
              },
            },
            examples: [
              {
                message: 'Row not found',
                code: 404,
                cause: 'ROW_NOT_FOUND',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['REMOVE_ROW_FROM_TRASH_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {
      ...GetRowCollectionSlugSchema.parse(request.params),
      ...GetRowCollectionByIdSchema.parse(request.params),
    };

    const result = await this.useCase.execute({ ...params });

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
