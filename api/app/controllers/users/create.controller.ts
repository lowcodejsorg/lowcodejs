/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import CreateUserUseCase from '@use-case/users/create.use-case';
import { CreateUserSchema } from '@validators/users';

@Controller()
export default class {
  constructor(
    private readonly useCase: CreateUserUseCase = getInstanceByToken(
      CreateUserUseCase,
    ),
  ) {}

  @POST({
    url: '/users',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Users'],
        summary: 'Create a new user',
        description:
          'Creates a new user account with name, email, password and assigns to a group',
        security: [{ cookieAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'email', 'password', 'group'],
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
            group: {
              type: 'string',
              description: 'User group ID',
            },
          },
        },
        response: {
          201: {
            description:
              'User created successfully with populated group information',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'User ID' },
              name: { type: 'string', description: 'User full name' },
              email: {
                type: 'string',
                format: 'email',
                description: 'User email',
              },
              group: {
                type: 'object',
                description: 'User group details (populated)',
                properties: {
                  _id: { type: 'string', description: 'Group ID' },
                  name: { type: 'string', description: 'Group name' },
                  description: {
                    type: 'string',
                    description: 'Group description',
                  },
                  permissions: {
                    type: 'array',
                    items: { type: 'object' },
                    description: 'Group permissions',
                  },
                },
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive'],
                description: 'User status',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            description:
              'Bad request - Missing group parameter or Zod validation failed',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Specific validation error',
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: ['GROUP_NOT_INFORMED', 'INVALID_PARAMETERS'],
              },
            },
            examples: [
              {
                message: 'Group not informed',
                code: 400,
                cause: 'GROUP_NOT_INFORMED',
              },
            ],
          },
          401: {
            description: 'Unauthorized - Authentication required',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Unauthorized'] },
              code: { type: 'number', enum: [401] },
              cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
            },
          },
          409: {
            description: 'Conflict - User with this email already exists',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['User already exists'] },
              code: { type: 'number', enum: [409] },
              cause: { type: 'string', enum: ['USER_ALREADY_EXISTS'] },
            },
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['CREATE_USER_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = CreateUserSchema.parse(request.body);

    const result = await this.useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(201).send(result.value);
  }
}
