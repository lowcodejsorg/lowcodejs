/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import CreateCollectionUseCase from '@use-case/collections/create.use-case';
import { CreateCollectionSchema } from '@validators/collections.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: CreateCollectionUseCase = getInstanceByToken(
      CreateCollectionUseCase,
    ),
  ) {}

  @POST({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Collections'],
        summary: 'Create a new collection',
        description:
          'Creates a new collection with fields, configuration and permissions settings',
        security: [{ cookieAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Collection name',
            },
          },
        },
        response: {
          201: {
            description: 'Collection created successfully',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Collection ID' },
              name: { type: 'string', description: 'Collection name' },
              description: {
                type: 'string',
                nullable: true,
                description: 'Collection description',
              },
              slug: { type: 'string', description: 'Collection URL slug' },
              logo: {
                type: 'object',
                nullable: true,
                description: 'Collection logo storage details (populated)',
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
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', description: 'Field ID' },
                    name: { type: 'string', description: 'Field name' },
                    slug: {
                      type: 'string',
                      description: 'Field slug (generated from name)',
                    },
                    type: {
                      type: 'string',
                      description: 'Field type from FIELD_TYPE enum',
                    },
                    configuration: {
                      type: 'object',
                      description: 'Field configuration',
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
                description: 'Collection fields (processed with slugs)',
              },
              configuration: {
                type: 'object',
                properties: {
                  style: { type: 'string', enum: ['gallery', 'list'] },
                  visibility: {
                    type: 'string',
                    enum: ['public', 'restricted'],
                  },
                  collaboration: {
                    type: 'string',
                    enum: ['open', 'restricted'],
                  },
                  administrators: {
                    type: 'array',
                    description: 'Administrator users (populated)',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', description: 'User ID' },
                        name: { type: 'string', description: 'User name' },
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
                      orderList: { type: 'array', items: { type: 'string' } },
                      orderForm: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
                description: 'Collection configuration with populated owner',
              },
              type: {
                type: 'string',
                enum: ['collection'],
                description: 'Collection type (always collection)',
              },
              _schema: {
                type: 'object',
                description:
                  'Generated MongoDB schema based on fields with trashedAt and trashed properties',
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
          400: {
            description: 'Bad request - Owner required or validation error',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Owner required',
                  'Invalid collection name',
                  'Invalid field configuration',
                  'Required fields missing',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: [
                  'OWNER_REQUIRED',
                  'INVALID_PARAMETERS',
                  'INVALID_FIELD_CONFIG',
                ],
              },
            },
            examples: [
              {
                message: 'Owner required',
                code: 400,
                cause: 'OWNER_REQUIRED',
              },
              {
                message: 'Invalid collection name',
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
          },
          409: {
            description: 'Conflict - Collection with this name already exists',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Collection already exists'] },
              code: { type: 'number', enum: [409] },
              cause: { type: 'string', enum: ['COLLECTION_ALREADY_EXISTS'] },
            },
            examples: [
              {
                message: 'Collection already exists',
                code: 409,
                cause: 'COLLECTION_ALREADY_EXISTS',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['CREATE_COLLECTION_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = CreateCollectionSchema.parse(request.body);

    const result = await this.useCase.execute({
      ...payload,
      owner: request.user.sub,
    });

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
