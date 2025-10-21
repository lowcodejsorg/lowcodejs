/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, getInstanceByToken } from 'fastify-decorators';
import z from 'zod';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import DeleteStorageUseCase from '@use-case/storage/delete.use-case';

const Schema = z.object({
  _id: z.string(),
});

@Controller({
  route: '/storage',
})
export default class {
  constructor(
    private readonly useCase: DeleteStorageUseCase = getInstanceByToken(
      DeleteStorageUseCase,
    ),
  ) {}

  @DELETE({
    url: '/:_id',
    options: {
      onRequest: [AuthenticationMiddleware],

      schema: {
        tags: ['Storage'],
        summary: 'Delete file from storage',
        description:
          'Permanently deletes a file from both the database and file system. This action cannot be undone.',
        security: [{ cookieAuth: [] }],
        params: {
          type: 'object',
          required: ['_id'],
          properties: {
            _id: {
              type: 'string',
              description: 'Storage record ID to delete',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description: 'File deleted successfully',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['File deleted successfully'] },
              deletedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Deletion timestamp',
              },
            },
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
            description: 'Not found - Storage record does not exist',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Storage not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['STORAGE_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'Storage not found',
                code: 404,
                cause: 'STORAGE_NOT_FOUND',
              },
            ],
          },
          500: {
            description:
              'Internal server error - Database or file system issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['STORAGE_DELETE_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = Schema.parse(request.params);

    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send({
      message: 'File deleted successfully',
      deletedAt: new Date().toISOString(),
    });
  }
}
