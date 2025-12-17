import type { FastifySchema } from 'fastify';

export const SignInSchema: FastifySchema = {
  tags: ['Authentication'],
  summary: 'User authentication sign in',
  description:
    'Authenticates a user with email and password, returning JWT tokens as HTTP-only cookies',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
      },
      password: {
        type: 'string',
        description: 'User password',
      },
    },
  },
  response: {
    200: {
      description:
        'Successful authentication - Sets httpOnly cookies for accessToken and refreshToken',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Authentication successful'] },
      },
      headers: {
        'Set-Cookie': {
          type: 'string',
          description: 'Authentication cookies (accessToken, refreshToken)',
        },
      },
    },
    400: {
      description:
        'Bad request - Invalid request format or Zod validation failed',
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Error description' },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['INVALID_PARAMETERS'] },
      },
    },
    401: {
      description: 'Unauthorized - User not found, inactive, or wrong password',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Specific error message',
        },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
      examples: [
        {
          message: 'Unauthorized',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
        },
        {
          message: 'Unauthorized',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
        },
        {
          message: 'Credenciais invalidas',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
        },
      ],
    },
    500: {
      description: 'Internal server error - Database or server issues',
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Internal server error' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['SIGN_IN_ERROR'] },
      },
    },
  },
};
