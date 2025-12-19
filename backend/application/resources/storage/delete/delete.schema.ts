import type { FastifySchema } from 'fastify';

export const StorageDeleteSchema: FastifySchema = {
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
      description: 'Internal server error - Database or file system issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['STORAGE_DELETE_ERROR'] },
      },
    },
  },
};
