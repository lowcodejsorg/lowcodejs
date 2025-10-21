/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import SendRowToTrashUseCase from '@use-case/rows/send-to-trash.use-case';
import {
  GetRowCollectionByIdSchema,
  GetRowCollectionSlugSchema,
} from '@validators/row-collection.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: SendRowToTrashUseCase = getInstanceByToken(
      SendRowToTrashUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:slug/rows/:_id/trash',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Rows'],
        summary: 'Send row to trash',
        description:
          'Moves a row to trash by setting trashed=true and trashedAt timestamp. The row can be restored later or permanently deleted.',
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
              description: 'Row ID to move to trash',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description: 'Row moved to trash successfully',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Row ID' },
              trashed: {
                type: 'boolean',
                enum: [true],
                description: 'Row is now in trash',
              },
              trashedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Timestamp when moved to trash',
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
            description: 'Not found - Collection or row does not exist',
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
              cause: { type: 'string', enum: ['SEND_ROW_TO_TRASH_ERROR'] },
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
