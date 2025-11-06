import type { FastifySchema } from 'fastify';

export const UserGroupShowSchema: FastifySchema = {
  tags: ['User Group'],
  summary: 'Get user group by ID',
  description: 'Retrieves a specific user group by its ID',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['_id'],
    properties: {
      _id: {
        type: 'string',
        description: 'User group ID',
      },
    },
  },
  response: {
    200: {
      description: 'User group details',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        permissions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
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
    404: {
      description: 'User group not found',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['User group not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['USER_GROUP_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'User group not found',
          code: 404,
          cause: 'USER_GROUP_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['GET_USER_GROUP_ERROR'] },
      },
      examples: [
        {
          message: 'Internal server error',
          code: 500,
          cause: 'GET_USER_GROUP_ERROR',
        },
      ],
    },
  },
};
