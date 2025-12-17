import type { FastifySchema } from 'fastify';

export const RefreshTokenSchema: FastifySchema = {
  tags: ['Authentication'],
  summary: 'Refresh authentication tokens',
  description:
    'Refreshes access and refresh tokens using the current refresh token from cookies. Requires valid refresh token cookie.',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'Tokens refreshed successfully',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Tokens refreshed successfully'],
        },
      },
    },
    401: {
      description: 'Unauthorized - Missing or invalid refresh token',
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Error message' },
        code: { type: 'number', enum: [401] },
        cause: {
          type: 'string',
          enum: ['MISSING_REFRESH_TOKEN', 'INVALID_REFRESH_TOKEN'],
        },
      },
      examples: [
        {
          message: 'Missing refresh token',
          code: 401,
          cause: 'MISSING_REFRESH_TOKEN',
        },
        {
          message: 'Invalid or expired refresh token',
          code: 401,
          cause: 'INVALID_REFRESH_TOKEN',
        },
      ],
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['REFRESH_TOKEN_ERROR'] },
      },
      examples: [
        {
          message: 'Internal server error',
          code: 500,
          cause: 'REFRESH_TOKEN_ERROR',
        },
      ],
    },
  },
};
