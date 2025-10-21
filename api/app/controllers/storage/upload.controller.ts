/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import UploadStorageUseCase from '@use-case/storage/upload.use-case';

@Controller({
  route: '/storage',
})
export default class {
  constructor(
    private readonly useCase: UploadStorageUseCase = getInstanceByToken(
      UploadStorageUseCase,
    ),
  ) {}

  @POST({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],

      schema: {
        tags: ['Storage'],
        summary: 'Upload files to storage',
        description:
          'Uploads one or more files to the server storage system. Files are saved to the configured storage directory and metadata is stored in the database.',
        security: [{ cookieAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          201: {
            description: 'Files uploaded successfully',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Storage record ID' },
                filename: {
                  type: 'string',
                  description: 'Generated filename with extension',
                  examples: ['12345678.jpg', '87654321.pdf'],
                },
                url: {
                  type: 'string',
                  format: 'uri',
                  description: 'Full URL to access the uploaded file',
                  examples: ['http://localhost:3000/storage/12345678.jpg'],
                },
                type: {
                  type: 'string',
                  description: 'MIME type of the uploaded file',
                  examples: ['image/jpeg', 'application/pdf', 'text/plain'],
                },
                size: {
                  type: 'number',
                  description: 'File size in bytes',
                  examples: [12345678],
                },
                originalName: {
                  type: 'string',
                  description: 'Original filename with extension',
                  examples: ['12345678.jpg', '87654321.pdf'],
                },
                trashed: {
                  type: 'boolean',
                  enum: [false],
                  description: 'File is not trashed',
                },
                trashedAt: {
                  type: 'string',
                  nullable: true,
                  description: 'When file was trashed (null for new files)',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Upload timestamp',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Last update timestamp',
                },
              },
            },
          },
          400: {
            description: 'Bad request - Invalid file format or size exceeded',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'File type not allowed',
                  'File size exceeded',
                  'No files provided',
                  'Invalid file format',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: [
                  'INVALID_FILE_TYPE',
                  'FILE_SIZE_EXCEEDED',
                  'NO_FILES_PROVIDED',
                ],
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
          413: {
            description: 'Payload too large - File size exceeds server limits',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['File too large'] },
              code: { type: 'number', enum: [413] },
              cause: { type: 'string', enum: ['PAYLOAD_TOO_LARGE'] },
            },
          },
          500: {
            description: 'Internal server error - Storage or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['STORAGE_UPLOAD_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const result = await this.useCase.execute(request.files());

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(201).send(result.value);
  }
}
