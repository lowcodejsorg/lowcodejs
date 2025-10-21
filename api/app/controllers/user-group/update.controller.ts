/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import UpdateUserGroupUseCase from '@use-case/user-group/update.use-case';
import {
  GetUserGroupByIdSchema,
  UpdateUserGroupSchema,
} from '@validators/user-group.validator';

@Controller({
  route: '/user-group',
})
export default class {
  constructor(
    private readonly useCase: UpdateUserGroupUseCase = getInstanceByToken(
      UpdateUserGroupUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:_id',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['User Group'],
        summary: 'Update user group',
        description:
          'Updates an existing user group with new description and permissions',
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
        body: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              nullable: true,
              description: 'Updated user group description',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Updated array of permission IDs',
            },
          },
        },
        response: {
          200: {
            description: 'User group updated successfully',
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              slug: { type: 'string' },
              // permissions: { type: 'array', items: { type: 'string' } },
              permissions: {
                type: 'array',
                description: 'Permissions assigned to the user group',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', description: 'Field ID' },
                    name: { type: 'string', description: 'Field name' },
                    slug: { type: 'string', description: 'Field slug' },
                    description: {
                      type: 'string',
                      description: 'Field description',
                    },
                    trashed: {
                      type: 'boolean',
                      description: 'Is field in trash',
                    },
                    trashedAt: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                      description: 'When field was trashed',
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
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
              cause: { type: 'string', enum: ['UPDATE_USER_GROUP_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'UPDATE_USER_GROUP_ERROR',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = GetUserGroupByIdSchema.parse(request.params);
    const payload = UpdateUserGroupSchema.parse(request.body);

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
