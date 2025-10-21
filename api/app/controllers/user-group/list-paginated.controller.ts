/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import ListUserGroupPaginatedUseCase from '@use-case/user-group/list-paginated.use-case';
import { ListCollectionPaginatedSchema } from '@validators/collections.validator';

@Controller({
  route: 'user-group',
})
export default class {
  constructor(
    private readonly useCase: ListUserGroupPaginatedUseCase = getInstanceByToken(
      ListUserGroupPaginatedUseCase,
    ),
  ) {}

  @GET({
    url: '/paginated',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['User Group'],
        summary: 'List user groups with pagination',
        description:
          'Retrieves a paginated list of user groups with optional search functionality',
        security: [{ cookieAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              minimum: 1,
              default: 1,
              description: 'Page number',
            },
            perPage: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              default: 50,
              description: 'Items per page',
            },
            search: {
              type: 'string',
              description: 'Search term for filtering groups',
            },
          },
        },
        response: {
          200: {
            description: 'Paginated list of user groups',
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
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
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = ListCollectionPaginatedSchema.parse(request.query);

    const result = await this.useCase.execute(query);

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
