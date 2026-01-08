import type { FastifySchema } from 'fastify';

export const UserGroupListSchema: FastifySchema = {
  tags: ['User Group'],
  summary: 'List all user groups',
  description:
    'Retrieves a complete list of all user groups without pagination',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'Complete list of user groups',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          permissions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Permission ID' },
                name: {
                  type: 'string',
                  description: 'Permission name',
                },
                slug: {
                  type: 'string',
                  description: 'Permission slug',
                },
                description: {
                  type: 'string',
                  nullable: true,
                  description: 'Permission description',
                },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Authentication required'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
      examples: [
        {
          message: 'Authentication required',
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
        cause: { type: 'string', enum: ['INTERNAL_SERVER_ERROR'] },
      },
      examples: [
        {
          message: 'Internal server error',
          code: 500,
          cause: 'INTERNAL_SERVER_ERROR',
        },
      ],
    },
  },
};
