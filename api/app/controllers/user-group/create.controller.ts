/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import CreateUserGroupUseCase from '@use-case/user-group/create.use-case';
import { CreateUserGroupSchema } from '@validators/user-group.validator';

@Controller()
export default class {
  constructor(
    private readonly useCase: CreateUserGroupUseCase = getInstanceByToken(
      CreateUserGroupUseCase,
    ),
  ) {}

  @POST({
    url: '/user-group',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['User Group'],
        summary: 'Create a new user group',
        description:
          'Creates a new user group with name, description and permissions',
        security: [{ cookieAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'User group name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'User group description',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of permission IDs',
            },
          },
        },
        response: {
          201: {
            description: 'User group created successfully',
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
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
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['CREATE_USER_GROUP_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'CREATE_USER_GROUP_ERROR',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = CreateUserGroupSchema.parse(request.body);

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
