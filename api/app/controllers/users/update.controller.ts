/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import UpdateUserUseCase from '@use-case/users/update.use-case';
import { GetUserByIdSchema, UpdateUserSchema } from '@validators/users';

@Controller({
  route: '/users',
})
export default class {
  constructor(
    private readonly useCase: UpdateUserUseCase = getInstanceByToken(
      UpdateUserUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:_id',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Users'],
        summary: 'Update user',
        description:
          'Updates an existing user with new information including optional password change',
        security: [{ cookieAuth: [] }],
        params: {
          type: 'object',
          required: ['_id'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
          },
        },
        body: {
          type: 'object',
          required: ['name', 'email', 'group', 'status'],
          properties: {
            name: {
              type: 'string',
              description: 'Updated user full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Updated user email address',
            },
            group: {
              type: 'string',
              description: 'Updated user group ID',
            },
            password: {
              type: 'string',
              description: 'New password (optional)',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'User status',
            },
          },
        },
        response: {
          200: {
            description: 'User updated successfully',
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              group: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
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
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['User not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['USER_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'User not found',
                code: 404,
                cause: 'USER_NOT_FOUND',
              },
            ],
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['UPDATE_USER_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'UPDATE_USER_ERROR',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = GetUserByIdSchema.parse(request.params);
    const payload = UpdateUserSchema.parse(request.body);

    const result = await this.useCase.execute({
      ...params,
      ...payload,
    });

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
