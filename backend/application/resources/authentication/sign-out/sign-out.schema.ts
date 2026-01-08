import type { FastifySchema } from 'fastify';

export const SignOutSchema: FastifySchema = {
  tags: ['Authentication'],
  summary: 'User sign out',
  description:
    'Signs out the current user by clearing authentication cookies. Requires valid access token.',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'Successfully signed out',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Successfully signed out'] },
      },
    },
    401: {
      description: 'Unauthorized - Invalid or missing access token',
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
  },
};
