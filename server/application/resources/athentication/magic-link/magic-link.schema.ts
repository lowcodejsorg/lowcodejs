import type { FastifySchema } from 'fastify';

export const MagicLinkSchema: FastifySchema = {
  tags: ['Authentication'],
  summary: 'Magic link authentication',
  description:
    'Authenticates user via magic link and redirects to dashboard with authentication cookies set',
  querystring: {
    type: 'object',
    required: ['code'],
    properties: {
      code: {
        type: 'string',
        description: 'Magic link authentication code',
      },
    },
  },
  response: {
    302: {
      description: 'Successful authentication - redirects to dashboard',
      type: 'object',
      properties: {},
    },
    400: {
      description: 'Bad request - Invalid or expired magic link code',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Invalid magic link code', 'Magic link has expired'],
        },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['INVALID_CODE', 'CODE_EXPIRED'] },
      },
      examples: [
        {
          message: 'Invalid magic link code',
          code: 400,
          cause: 'INVALID_CODE',
        },
        {
          message: 'Magic link has expired',
          code: 400,
          cause: 'CODE_EXPIRED',
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
