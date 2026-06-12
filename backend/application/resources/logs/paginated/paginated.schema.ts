import type { FastifySchema } from 'fastify';

import {
  E_LOGGER_ACTION_TYPE,
  E_LOGGER_OBJECT_TYPE,
} from '@application/core/entity.core';

export const LoggerPaginatedSchema: FastifySchema = {
  tags: ['Logs'],
  summary: 'List logs with pagination',
  description:
    'Retrieves a paginated list of log entries with optional search and filtering functionality',
  security: [{ cookieAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        minimum: 1,
        default: 1,
        description: 'Page number (starts from 1)',
        examples: [1, 2, 5],
      },
      perPage: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 50,
        description: 'Number of items per page (max 100)',
        examples: [10, 25, 50, 100],
      },
      search: {
        type: 'string',
        minLength: 1,
        description:
          'Search term for filtering logs by URL or object ID (optional)',
        examples: ['/api/users', 'CREATE', '507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Paginated list of log entries',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              url: {
                type: 'string',
                description: 'The URL that triggered the log entry',
              },
              user: {
                type: 'object',
                nullable: true,
                description: 'User who performed the action (nullable)',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              action: {
                type: 'string',
                description: 'Type of action performed',
                examples: Object.values(E_LOGGER_ACTION_TYPE),
              },
              object: {
                type: 'string',
                description: 'Type of object affected by the action',
                examples: Object.values(E_LOGGER_OBJECT_TYPE),
              },
              object_id: {
                type: ['string', 'null'],
                description: 'ID of the affected object (nullable)',
              },
              content: {
                description:
                  'Additional content/payload of the log entry (nullable, any type)',
                nullable: true,
              },
              creator: {
                type: 'object',
                nullable: true,
                description: 'User who created the referenced record (nullable)',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              updatedBy: {
                type: 'object',
                nullable: true,
                description:
                  'User who last updated the referenced record (nullable)',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              objectCreatedAt: {
                type: ['string', 'null'],
                format: 'date-time',
                description: 'When the referenced record was created (nullable)',
              },
              objectUpdatedAt: {
                type: ['string', 'null'],
                format: 'date-time',
                description:
                  'When the referenced record was last updated (nullable)',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            perPage: { type: 'number' },
            page: { type: 'number' },
            lastPage: { type: 'number' },
            firstPage: { type: 'number' },
          },
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
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
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
        cause: { type: 'string', enum: ['LIST_LOGGER_PAGINATED_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      examples: [
        {
          message: 'Internal server error',
          code: 500,
          cause: 'LIST_LOGGER_PAGINATED_ERROR',
        },
      ],
    },
  },
};
