import type { FastifySchema } from 'fastify';

export const RequestCodeSchema: FastifySchema = {
  tags: ['Authentication'],
  summary: 'Request password recovery code',
  description: 'Sends a password recovery code to the specified email address',
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Email address to send recovery code to',
      },
    },
  },
  response: {
    200: {
      description: 'Recovery code sent successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    400: {
      description: 'Bad request - Invalid email or validation error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Invalid email format'] },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['INVALID_PARAMETERS'] },
      },
      examples: [
        {
          message: 'Invalid email format',
          code: 400,
          cause: 'INVALID_PARAMETERS',
        },
      ],
    },
    404: {
      description: 'Email not found',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Email not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['EMAIL_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'Email not found',
          code: 404,
          cause: 'EMAIL_NOT_FOUND',
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
