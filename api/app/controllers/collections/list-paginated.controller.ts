/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import ListCollectionPaginatedUseCase from '@use-case/collections/list-paginated.use-case';
import {
  GetCollectionQuerySchema,
  ListCollectionPaginatedSchema,
} from '@validators/collections.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: ListCollectionPaginatedUseCase = getInstanceByToken(
      ListCollectionPaginatedUseCase,
    ),
  ) {}

  @GET({
    url: '/paginated',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Collections'],
        summary: 'List collections paginated',
        description:
          'Get a paginated list of collections with optional search and filtering',
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
                'Search term for filtering collections by name or slug (optional)',
              examples: ['user', 'product', 'blog'],
            },
            trashed: {
              type: 'string',
              enum: ['true', 'false'],
              default: 'false',
              description: 'Include trashed items (optional)',
              examples: ['true', 'false'],
            },
            public: {
              type: 'string',
              enum: ['true', 'false'],
              default: 'false',
              description: 'Filter by public visibility (optional)',
              examples: ['true', 'false'],
            },
            type: {
              type: 'string',
              enum: ['collection', 'field-group'],
              description: 'Filter by collection type (optional)',
              examples: ['collection', 'field-group'],
            },
            name: {
              type: 'string',
              description: 'Filter by exact collection name (optional)',
              examples: ['Users', 'Products'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description: 'Paginated list of collections',
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', description: 'Collection ID' },
                    name: { type: 'string', description: 'Collection name' },
                    description: {
                      type: 'string',
                      nullable: true,
                      description: 'Collection description',
                    },
                    slug: {
                      type: 'string',
                      description: 'Collection URL slug',
                    },
                    logo: {
                      type: 'object',
                      nullable: true,
                      description:
                        'Collection logo storage details (populated)',
                      properties: {
                        _id: { type: 'string', description: 'Storage ID' },
                        url: { type: 'string', description: 'File URL' },
                        filename: {
                          type: 'string',
                          description: 'Original filename',
                        },
                        type: { type: 'string', description: 'MIME type' },
                      },
                    },
                    fields: {
                      type: 'array',
                      description: 'Collection fields',
                      items: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string', description: 'Field ID' },
                          name: { type: 'string', description: 'Field name' },
                          slug: { type: 'string', description: 'Field slug' },
                          type: {
                            type: 'string',
                            enum: [
                              'TEXT_SHORT',
                              'TEXT_LONG',
                              'DROPDOWN',
                              'DATE',
                              'RELATIONSHIP',
                              'FILE',
                              'FIELD_GROUP',
                              'REACTION',
                              'EVALUATION',
                              'CATEGORY',
                            ],
                            description: 'Field type',
                          },
                          configuration: {
                            type: 'object',
                            description: 'Field configuration',
                            additionalProperties: true,
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
                    configuration: {
                      type: 'object',
                      description: 'Collection configuration settings',
                      properties: {
                        style: {
                          type: 'string',
                          enum: ['gallery', 'list'],
                          description: 'Display style',
                        },
                        visibility: {
                          type: 'string',
                          enum: ['public', 'restricted'],
                          description: 'Visibility setting',
                        },
                        collaboration: {
                          type: 'string',
                          enum: ['open', 'restricted'],
                          description: 'Collaboration setting',
                        },
                        administrators: {
                          type: 'array',
                          description: 'Administrator users (populated)',
                          items: {
                            type: 'object',
                            properties: {
                              _id: { type: 'string', description: 'User ID' },
                              name: {
                                type: 'string',
                                description: 'User name',
                              },
                            },
                          },
                        },
                        owner: {
                          type: 'object',
                          description: 'Collection owner (populated)',
                          properties: {
                            _id: { type: 'string', description: 'User ID' },
                            name: { type: 'string', description: 'User name' },
                          },
                        },
                        fields: {
                          type: 'object',
                          properties: {
                            orderList: {
                              type: 'array',
                              items: { type: 'string' },
                              description: 'Field order for list view',
                            },
                            orderForm: {
                              type: 'array',
                              items: { type: 'string' },
                              description: 'Field order for form view',
                            },
                          },
                        },
                      },
                    },
                    type: {
                      type: 'string',
                      enum: ['collection', 'field-group'],
                      description: 'Collection type',
                    },
                    _schema: {
                      type: 'object',
                      description: 'Generated MongoDB schema based on fields',
                      additionalProperties: true,
                    },
                    trashed: {
                      type: 'boolean',
                      description: 'Is collection in trash',
                    },
                    trashedAt: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                      description: 'When collection was trashed',
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  total: {
                    type: 'number',
                    description: 'Total number of collections',
                  },
                  perPage: {
                    type: 'number',
                    description: 'Number of items per page',
                  },
                  page: { type: 'number', description: 'Current page number' },
                  lastPage: { type: 'number', description: 'Last page number' },
                  firstPage: {
                    type: 'number',
                    description: 'First page number',
                  },
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
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: {
                type: 'string',
                enum: ['COLLECTION_LIST_PAGINATED_ERROR'],
              },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const pagination = ListCollectionPaginatedSchema.parse(request.query);
    const query = GetCollectionQuerySchema.parse(request.query);

    const result = await this.useCase.execute({
      ...pagination,
      ...query,
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
