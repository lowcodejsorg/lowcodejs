/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import ListUserPaginatedUseCase from '@use-case/users/list-paginated.use-case';
import { ListUserPaginatedSchema } from '@validators/users';

@Controller({
  route: '/users',
})
export default class {
  constructor(
    private readonly useCase: ListUserPaginatedUseCase = getInstanceByToken(
      ListUserPaginatedUseCase,
    ),
  ) {}

  @GET({
    url: '/paginated',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Users'],
        summary: 'List users with pagination',
        description:
          'Retrieves a paginated list of users with optional search functionality',
        security: [{ cookieAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              minimum: 1,
              default: 1,
              description: 'Page number (starts from 1)',
              examples: [1, 2, 5],
            },
            perPage: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              default: 50,
              description: 'Number of items per page (max 100)',
              examples: [10, 25, 50, 100],
            },
            search: {
              type: 'string',
              minLength: 1,
              description:
                'Search term for filtering users by name or email (optional)',
              examples: ['john', 'john@example.com', 'doe'],
            },
            sub: {
              type: 'string',
              description:
                'User ID for filtering specific user (optional, used internally)',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description: 'Paginated list of users',
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
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
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  perPage: { type: 'number' },
                  page: { type: 'number' },
                  lastPage: { type: 'number' },
                  firstPage: { type: 'number' },
                },
              },
            },
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
              cause: { type: 'string', enum: ['LIST_USERS_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'LIST_USERS_ERROR',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = ListUserPaginatedSchema.parse(request.query);

    const result = await this.useCase.execute({
      ...query,
      sub: request?.user?.sub,
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
