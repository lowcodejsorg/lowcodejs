import type { FastifySchema } from 'fastify';

export const SignUpSchema: FastifySchema = {
  tags: ['Authentication'],
  summary: 'User registration sign up',
  description: 'Creates a new user account with name, email and password',
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: {
        type: 'string',
        description: 'User full name',
      },
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
    201: {
      description: 'User created successfully',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['User created successfully'] },
      },
    },
    400: {
      description: 'Bad request - Validation error',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Validation error message',
        },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['INVALID_PARAMETERS'] },
      },
      examples: [
        {
          message: 'Validation failed',
          code: 400,
          cause: 'INVALID_PARAMETERS',
        },
      ],
    },
    409: {
      description: 'Conflict - User already exists or group not found',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Conflict error message',
        },
        code: { type: 'number', enum: [409] },
        cause: {
          type: 'string',
          enum: ['USER_ALREADY_EXISTS', 'GROUP_NOT_FOUND'],
        },
      },
      examples: [
        {
          message: 'User already exists',
          code: 409,
          cause: 'USER_ALREADY_EXISTS',
        },
        {
          message: 'Group not found',
          code: 409,
          cause: 'GROUP_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['SIGN_UP_ERROR'] },
      },
      examples: [
        {
          message: 'Internal server error',
          code: 500,
          cause: 'SIGN_UP_ERROR',
        },
      ],
    },
  },
};
