import type { FastifySchema } from 'fastify';

export const PermissionListSchema: FastifySchema = {
  tags: ['Permissions'],
  summary: 'List permissions',
  description: 'Get list of all available permissions in the system',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'List of all permissions',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
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
      examples: [
        {
          message: 'Unauthorized',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
        },
      ],
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['LIST_PERMISSIONS_ERROR'] },
      },
      examples: [
        {
          message: 'Internal server error',
          code: 500,
          cause: 'LIST_PERMISSIONS_ERROR',
        },
      ],
    },
  },
};
